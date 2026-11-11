import { useMemo } from 'preact/hooks'
import * as app from '../appv'
import * as video_player from './value'

export interface SubtitleItem
{
  start: number
  end: number
  text: string
}

export interface PairedSubtitle
{
  start: number
  end: number
  text1: string
  text2?: string
}

export function parseSRT(srt: string): SubtitleItem[]
{
  if (!srt) return []
  const normalized = srt.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const pattern =
    /(?:(\d{1,2}:)?(\d{2}:\d{2}[,.]\d{3}))\s*-->\s*(?:(\d{1,2}:)?(\d{2}:\d{2}[,.]\d{3}))\s*\n([\s\S]*?)(?=\n\s*\n|$)/g
  const results: SubtitleItem[] = []

  const timeToSeconds = (timeStr: string) =>
  {
    const parts = timeStr.replace(',', '.').split(':')
    if (parts.length === 3)
    {
      const [h, m, sMs] = parts
      const [s, ms] = sMs.split('.')
      return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms || '0', 10) / 1000
    } else if (parts.length === 2)
    {
      const [m, sMs] = parts
      const [s, ms] = sMs.split('.')
      return parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms || '0', 10) / 1000
    }
    return 0
  }

  let match: RegExpExecArray | null
  while ((match = pattern.exec(normalized)) !== null)
  {
    const startStr = (match[1] || '') + match[2]
    const endStr = (match[3] || '') + match[4]
    results.push({
      start: timeToSeconds(startStr),
      end: timeToSeconds(endStr),
      text: match[5].replace(/<[^>]+>/g, '').trim(),
    })
  }
  return results
}

/**
 * 德语与国际化自适应分词：采用标准 Intl.Segmenter('de')，
 * 识别德语变音字母 ä, ö, ü, Ä, Ö, Ü, ß 及连词符，自动剥离标点。
 */
export function extractWords(text: string): string[]
{
  if (!text) return []

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl)
  {
    const segmenter = new Intl.Segmenter('de', { granularity: 'word' })
    const words: string[] = []
    for (const { segment, isWordLike } of segmenter.segment(text))
    {
      if (isWordLike)
      {
        const cleaned = segment.toLowerCase().replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, '')
        if (cleaned) words.push(cleaned)
      }
    }
    return words
  }

  // Unicode 广义字母正则回退
  const matches = text.toLowerCase().match(/[\p{L}0-9'-]+/gu) || []
  return matches
    .map(w => w.replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, ''))
    .filter(Boolean)
}

/**
 * 判断句子是否已掌握：所有单词均为 pass === true
 */
export function isSentencePassed(text: string, wordStat: Record<string, boolean>): boolean
{
  const words = extractWords(text)
  if (words.length === 0) return true
  return words.every(w => wordStat[w] === true)
}

/**
 * 查找上一个实际可播放/未被自动跳过的句子索引
 */
export function findPrevPlayableIndex(
  subs: Array<{ text1?: string; text?: string }>,
  currentIdx: number,
  isAutoSkip: boolean,
  wordStat: Record<string, boolean>,
): number
{
  if (currentIdx <= 0) return -1
  if (!isAutoSkip) return currentIdx - 1

  for (let i = currentIdx - 1; i >= 0; i--)
  {
    const text = subs[i].text1 ?? subs[i].text ?? ''
    if (!isSentencePassed(text, wordStat))
    {
      return i
    }
  }
  return 0
}

/**
 * 查找下一个实际可播放/未被自动跳过的句子索引
 */
export function findNextPlayableIndex(
  subs: Array<{ text1?: string; text?: string }>,
  currentIdx: number,
  isAutoSkip: boolean,
  wordStat: Record<string, boolean>,
): number
{
  if (currentIdx < 0 || currentIdx >= subs.length - 1) return -1
  if (!isAutoSkip) return currentIdx + 1

  for (let i = currentIdx + 1; i < subs.length; i++)
  {
    const text = subs[i].text1 ?? subs[i].text ?? ''
    if (!isSentencePassed(text, wordStat))
    {
      return i
    }
  }
  return -1
}

/**
 * 单词样式：
 * pass 的单词显示黑色
 * 不 pass 的单词显示 Pico 主颜色并加粗
 */
export function getWordStyle(pass: boolean | undefined)
{
  if (pass === true)
  {
    return {
      color: '#000000',
    }
  }

  return {
    color: 'var(--pico-primary)',
    fontWeight: 'bold',
  }
}

export function SrtPart()
{
  const pairedSubtitles = useMemo<PairedSubtitle[]>(() =>
  {
    const srt1 = video_player.video_info.value?.srt_1 ?? ''
    const srt2 = video_player.video_info.value?.srt_2 ?? ''

    const subs1 = parseSRT(srt1)
    const subs2 = parseSRT(srt2)

    if (subs1.length === 0 && subs2.length > 0)
    {
      return subs2.map(s => ({ start: s.start, end: s.end, text1: '', text2: s.text }))
    }

    return subs1.map(s1 =>
    {
      const matched2 = subs2.find(s2 => Math.max(s1.start, s2.start) < Math.min(s1.end, s2.end))
      return {
        start: s1.start,
        end: s1.end,
        text1: s1.text,
        text2: matched2?.text,
      }
    })
  }, [video_player.video_info.value?.srt_1, video_player.video_info.value?.srt_2])

  // Determine current active subtitle index
  const currentTime = video_player.current_time.value
  let activeIndex = pairedSubtitles.findIndex(
    sub => currentTime >= sub.start && currentTime <= sub.end,
  )

  if (activeIndex === -1 && pairedSubtitles.length > 0)
  {
    const nextIdx = pairedSubtitles.findIndex(s => s.start > currentTime)
    if (nextIdx !== -1)
    {
      activeIndex = nextIdx
    } else
    {
      activeIndex = pairedSubtitles.length - 1
    }
  }

  // 当前正在播放的句子
  const currSub = activeIndex >= 0 && activeIndex < pairedSubtitles.length ? pairedSubtitles[activeIndex] : null

  return (
    <article
      onClick={() => currSub && video_player.player.value?.seekTo(currSub.start, true)}
      style={{
        margin: 0,
        padding: '16px 20px',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: currSub ? 'pointer' : 'default',
        boxSizing: 'border-box',
      }}
      title={currSub
        ? '点击重播这一句 (快捷键：按 → 下一句；按 ← 上一句重播；滚轮只打分不跳句)'
        : undefined}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {pairedSubtitles.length === 0
          ? (
            <div style={{ color: 'var(--pico-muted-color)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              No subtitles loaded. Please import subtitles in Video List.
            </div>
          )
          : currSub
          ? (
            <>
              <div style={{ fontSize: '1.35rem', fontWeight: 600, lineHeight: 1.45, letterSpacing: '0.01em' }}>
                {renderTokens(currSub.text1)}
              </div>
              {currSub.text2 && (
                <div style={{ fontSize: '1rem', color: 'var(--pico-muted-color)', marginTop: '6px', lineHeight: 1.4 }}>
                  {currSub.text2}
                </div>
              )}
            </>
          )
          : (
            <div style={{ color: 'var(--pico-muted-color)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Waiting for subtitle...
            </div>
          )}
      </div>
    </article>
  )
}

function renderTokens(text: string)
{
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl)
  {
    const segmenter = new Intl.Segmenter('de', { granularity: 'word' })
    const items = []
    let i = 0
    for (const { segment, isWordLike } of segmenter.segment(text))
    {
      if (isWordLike)
      {
        const cleanWord = segment.toLowerCase().replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, '')
        let pass = app.data.value.word_stat[cleanWord]
        if (pass === undefined)
        {
          pass = false
          app.data.value.word_stat[cleanWord] = false
        }
        const style = getWordStyle(pass)

        items.push(
          <span
            key={i++}
            style={{ ...style, padding: '0 2px', userSelect: 'text' }}
            title={pass ? `${segment} [Passed]` : `${segment} [Review]`}
          >
            {segment}
          </span>,
        )
      } else
      {
        items.push(<span key={i++}>{segment}</span>)
      }
    }
    return items
  }

  // Unicode 回退切词
  const parts = text.split(/([\p{L}0-9'-]+)/u)
  return parts.map((part, i) =>
  {
    if (/^[\p{L}0-9'-]+$/u.test(part))
    {
      const cleanWord = part.toLowerCase().replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, '')
      let pass = app.data.value.word_stat[cleanWord]
      if (pass === undefined)
      {
        pass = false
        app.data.value.word_stat[cleanWord] = false
      }
      const style = getWordStyle(pass)

      return (
        <span
          key={i}
          style={{ ...style, padding: '0 2px', userSelect: 'text' }}
          title={pass ? `${part} [Passed]` : `${part} [Review]`}
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}
