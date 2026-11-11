import { useEffect, useMemo, useRef } from 'preact/hooks'
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
  const listContainerRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLElement | null>(null)

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

  const wordStat = app.data.value.word_stat || {}
  const isAutoSkip = video_player.auto_skip_familiar.value

  // 如果开启跳过熟悉，右侧列表中已熟悉的句子直接过滤隐藏
  const displayedSubtitles = useMemo(() =>
  {
    if (!isAutoSkip) return pairedSubtitles
    return pairedSubtitles.filter(sub => !isSentencePassed(sub.text1, wordStat))
  }, [pairedSubtitles, isAutoSkip, wordStat])

  // 当前正在播放的时间与对应的字幕索引
  const currentTime = video_player.current_time.value
  let activeVisibleIdx = displayedSubtitles.findIndex(
    sub => currentTime >= sub.start && currentTime <= sub.end,
  )

  if (activeVisibleIdx === -1 && displayedSubtitles.length > 0)
  {
    const nextIdx = displayedSubtitles.findIndex(s => s.start > currentTime)
    if (nextIdx > 0)
    {
      activeVisibleIdx = nextIdx - 1
    }
  }

  // 随视频播放上下平滑自动滚动居中
  useEffect(() =>
  {
    if (activeItemRef.current && listContainerRef.current)
    {
      const container = listContainerRef.current
      const el = activeItemRef.current
      const elTop = el.offsetTop - container.offsetTop
      const targetScroll = elTop - (container.clientHeight / 2) + (el.offsetHeight / 2)

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      })
    }
  }, [activeVisibleIdx])

  const onToggleWord = (e: MouseEvent, cleanWord: string) =>
  {
    e.stopPropagation()
    const currentStat = { ...app.data.value.word_stat }
    const wasPassed = currentStat[cleanWord] === true
    currentStat[cleanWord] = !wasPassed
    app.data.value = {
      ...app.data.value,
      word_stat: currentStat,
    }
  }

  return (
    <div
      ref={listContainerRef}
      style={{
        maxHeight: '560px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingRight: '6px',
        boxSizing: 'border-box',
      }}
    >
      {pairedSubtitles.length === 0 ? (
        <article style={{ margin: 0, padding: '24px 16px', textAlign: 'center', color: 'var(--pico-muted-color)' }}>
          No subtitles loaded. Please import subtitles in Video List.
        </article>
      ) : displayedSubtitles.length === 0 ? (
        <article style={{ margin: 0, padding: '24px 16px', textAlign: 'center', color: 'var(--pico-muted-color)' }}>
          🎉 所有句子均已掌握 (已过滤熟句)
        </article>
      ) : (
        displayedSubtitles.map((sub, idx) =>
        {
          const isActive = idx === activeVisibleIdx
          const isPassed = isSentencePassed(sub.text1, wordStat)

          return (
            <article
              key={`${sub.start}-${sub.end}-${idx}`}
              ref={isActive ? (el => { activeItemRef.current = el }) : null}
              onClick={() => video_player.player.value?.seekTo(sub.start, true)}
              style={{
                margin: 0,
                padding: '12px 14px',
                borderRadius: 'var(--pico-border-radius)',
                border: isActive
                  ? '2px solid var(--pico-primary)'
                  : '1px solid var(--pico-card-border-color, #e0e0e0)',
                backgroundColor: isActive
                  ? 'var(--pico-card-background-color)'
                  : 'transparent',
                boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                cursor: 'pointer',
                transition: 'border 0.2s, background-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                flexShrink: 0,
              }}
              title='点击播放此句'
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  lineHeight: 1,
                }}
              >
                <span style={{ color: 'var(--pico-muted-color)', fontFamily: 'monospace' }}>
                  {formatTime(sub.start)} - {formatTime(sub.end)}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: isPassed ? '#2e7d32' : 'var(--pico-primary)',
                  }}
                >
                  {isPassed ? '✓ Passed' : 'Review'}
                </span>
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.4 }}>
                {renderTokens(sub.text1, onToggleWord)}
              </div>

              {sub.text2 && (
                <div style={{ fontSize: '0.88rem', color: 'var(--pico-muted-color)', lineHeight: 1.35 }}>
                  {sub.text2}
                </div>
              )}
            </article>
          )
        })
      )}
    </div>
  )
}

function formatTime(seconds: number): string
{
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function renderTokens(text: string, onToggleWord: (e: MouseEvent, word: string) => void)
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
            onClick={(e) => onToggleWord(e, cleanWord)}
            style={{
              ...style,
              padding: '1px 3px',
              borderRadius: '3px',
              cursor: 'pointer',
              userSelect: 'text',
              transition: 'background-color 0.15s',
            }}
            title={pass ? `"${segment}" 已掌握 (点击标记为生词)` : `"${segment}" 生词 (点击标记为已掌握)`}
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
          onClick={(e) => onToggleWord(e, cleanWord)}
          style={{
            ...style,
            padding: '1px 3px',
            borderRadius: '3px',
            cursor: 'pointer',
            userSelect: 'text',
            transition: 'background-color 0.15s',
          }}
          title={pass ? `"${part}" 已掌握 (点击标记为生词)` : `"${part}" 生词 (点击标记为已掌握)`}
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}
