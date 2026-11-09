import { useMemo, useState } from 'preact/hooks'
import type { WordStatItem } from '../appv'
import { video_list } from '../video_list/value'
import { video_player } from './value'

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
  const pattern = /(?:(\d{1,2}:)?(\d{2}:\d{2}[,.]\d{3}))\s*-->\s*(?:(\d{1,2}:)?(\d{2}:\d{2}[,.]\d{3}))\s*\n([\s\S]*?)(?=\n\s*\n|$)/g
  const results: SubtitleItem[] = []

  const timeToSeconds = (timeStr: string) =>
  {
    const parts = timeStr.replace(',', '.').split(':')
    if (parts.length === 3)
    {
      const [h, m, sMs] = parts
      const [s, ms] = sMs.split('.')
      return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms || '0', 10) / 1000
    }
    else if (parts.length === 2)
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
 * 德语与国际化自适应分词：优先采用国际标准 Intl.Segmenter('de')，
 * 完美识别德语变音字母 ä, ö, ü, Ä, Ö, Ü, ß 以及连词符，自动剥离标点。
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
 * 科学计算句子生词/难度权重 (0.0 ~ 1.0)
 * 采用贝叶斯拉普拉斯平滑生词概率，pass 标记词为 0
 */
export function calculateSentenceWeight(text: string, wordStat: Record<string, WordStatItem>): number
{
  const words = extractWords(text)
  if (words.length === 0) return 0

  let sumUnfamiliarity = 0
  for (const cleanWord of words)
  {
    const stat = wordStat[cleanWord]
    if (stat?.pass)
    {
      sumUnfamiliarity += 0
    }
    else if (stat)
    {
      const unfam = (stat.fail + 1) / (stat.success + stat.fail + 2)
      sumUnfamiliarity += unfam
    }
    else
    {
      sumUnfamiliarity += 0.5
    }
  }

  return sumUnfamiliarity / words.length
}

/**
 * 单词根据 fail 比例动态计算深浅颜色（素雅、低饱和质感）
 * fail 越多，偏向琥珀/浅砖红色；pass 则淡灰
 */
export function getWordStyle(stat: WordStatItem | undefined)
{
  if (stat?.pass)
  {
    return {
      color: '#94a3b8',
      opacity: 0.75,
    }
  }

  if (!stat || (stat.success === 0 && stat.fail === 0))
  {
    return {
      color: '#ffffff',
    }
  }

  const total = stat.success + stat.fail
  const failRate = stat.fail / total

  if (failRate >= 0.6 || stat.fail >= 3)
  {
    return {
      color: '#f87171',
      fontWeight: '600',
      borderBottom: '2px solid rgba(248, 113, 113, 0.7)',
    }
  }
  else if (failRate >= 0.3 || stat.fail >= 1)
  {
    return {
      color: '#fbbf24',
      fontWeight: '500',
      borderBottom: '1px dashed rgba(251, 191, 36, 0.7)',
    }
  }
  else
  {
    return {
      color: '#a7f3d0',
      fontWeight: '500',
      borderBottom: '1px dotted rgba(167, 243, 208, 0.6)',
    }
  }
}

export function SrtPart()
{
  const [selectedWord, setSelectedWord] = useState<{ word: string; sentence: string } | null>(null)

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
      const matched2 = subs2.find(s2 =>
        Math.max(s1.start, s2.start) < Math.min(s1.end, s2.end)
      )
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
    }
    else
    {
      activeIndex = pairedSubtitles.length - 1
    }
  }

  const prevSub = activeIndex > 0 ? pairedSubtitles[activeIndex - 1] : null
  const currSub = activeIndex >= 0 && activeIndex < pairedSubtitles.length ? pairedSubtitles[activeIndex] : null
  const nextSub = activeIndex >= 0 && activeIndex + 1 < pairedSubtitles.length ? pairedSubtitles[activeIndex + 1] : null

  const wordStat = video_list.data.value.word_stat || {}
  const currWeight = currSub ? calculateSentenceWeight(currSub.text1, wordStat) : 0
  const isAutoSkipActive = video_player.auto_skip_familiar.value && currWeight < video_player.skip_threshold.value

  const onWordClick = (word: string, sentence: string) =>
  {
    setSelectedWord({ word, sentence })
  }

  const markWord = (type: 'success' | 'fail') =>
  {
    if (!selectedWord) return
    const w = selectedWord.word.toLowerCase()
    const stat = wordStat[w] || { success: 0, fail: 0 }
    if (type === 'success') stat.success += 1
    else stat.fail += 1

    wordStat[w] = stat
    video_list.data.value = { ...video_list.data.value }
  }

  const togglePassWord = () =>
  {
    if (!selectedWord) return
    const w = selectedWord.word.toLowerCase()
    const stat = wordStat[w] || { success: 0, fail: 0 }
    stat.pass = !stat.pass
    wordStat[w] = stat
    video_list.data.value = { ...video_list.data.value }
  }

  const pronounceWord = (word: string) =>
  {
    if ('speechSynthesis' in window)
    {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'de-DE'
      window.speechSynthesis.speak(utterance)
    }
  }

  if (pairedSubtitles.length === 0)
  {
    return null
  }

  // If auto-skip is triggered for this sentence, don't show to maintain clean flow
  if (isAutoSkipActive)
  {
    return null
  }

  return (
    <div className='absolute left-0 right-0 bottom-4 flex flex-col items-center pointer-events-none z-15 px-4'>
      {/* Word Quick Review Card - 素雅浮层 */}
      {selectedWord && (
        <div className='pointer-events-auto mb-3 p-3.5 bg-slate-900/95 backdrop-blur-md rounded-xl border border-white/15 shadow-2xl text-xs text-white max-w-sm w-full animate-in fade-in zoom-in-95 duration-100'>
          <div className='flex justify-between items-center pb-2 border-b border-white/10'>
            <div className='flex items-center gap-2'>
              <span className='text-base font-semibold text-sky-300 font-serif'>{selectedWord.word}</span>
              <button
                type='button'
                onClick={() => pronounceWord(selectedWord.word)}
                className='text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs'
                title='朗读德语发音'
              >
                🔊
              </button>
            </div>
            <button
              type='button'
              onClick={() => setSelectedWord(null)}
              className='text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs p-1'
            >
              ✕
            </button>
          </div>

          <div className='py-2 text-[11px] text-slate-300 flex items-center justify-between'>
            {(() =>
            {
              const stat = wordStat[selectedWord.word.toLowerCase()]
              if (!stat) return <span className='text-slate-400'>生词本中尚无记录</span>
              return (
                <div className='flex items-center gap-2.5'>
                  <span>掌握: <strong className='text-emerald-400'>{stat.success}</strong></span>
                  <span>生词: <strong className='text-amber-400'>{stat.fail}</strong></span>
                  {stat.pass && <span className='text-emerald-300 font-medium'>[已掌握 Pass]</span>}
                </div>
              )
            })()}
          </div>

          <div className='flex items-center gap-2 pt-2 border-t border-white/10'>
            <button
              type='button'
              onClick={() => markWord('success')}
              className='flex-1 py-1 px-2 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 rounded-md transition-colors cursor-pointer'
            >
              ✓ 认识 (+1)
            </button>
            <button
              type='button'
              onClick={() => markWord('fail')}
              className='flex-1 py-1 px-2 text-[11px] font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 rounded-md transition-colors cursor-pointer'
            >
              ⭐ 生词 (+1)
            </button>
            <button
              type='button'
              onClick={togglePassWord}
              className='py-1 px-2 text-[11px] font-medium text-slate-300 bg-white/10 hover:bg-white/15 border border-white/10 rounded-md transition-colors cursor-pointer'
            >
              {wordStat[selectedWord.word.toLowerCase()]?.pass ? '取消 Pass' : '已掌握 Pass'}
            </button>
          </div>
        </div>
      )}

      {/* 3-Sentence Subtitle Box - 沉浸半透明素雅字幕盒 */}
      <div className='w-[min(94%,840px)] max-h-[46vh] bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 text-white flex flex-col gap-2.5 pointer-events-auto'>
        {/* 1. 上一句 */}
        {prevSub && (
          <div
            onClick={() => video_player.player.value?.seekTo(prevSub.start, true)}
            className='flex items-baseline gap-2.5 cursor-pointer py-1 px-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity'
            title='点击跳转至上一句 (快捷键: ← 或 滚轮向前)'
          >
            <span className='text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.5 rounded select-none font-medium shrink-0'>
              上一句
            </span>
            <div className='flex-1 min-w-0'>
              <div className='text-sm text-slate-300 leading-snug'>
                {prevSub.text1}
              </div>
              {prevSub.text2 && (
                <div className='text-xs text-slate-400 mt-0.5 leading-snug'>
                  {prevSub.text2}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 这一句 */}
        {currSub && (
          <div
            onClick={() => video_player.player.value?.seekTo(currSub.start, true)}
            className='flex items-baseline gap-3 cursor-pointer py-2 px-3 rounded-xl bg-white/5 border-l-4 border-sky-400 transition-colors hover:bg-white/10'
            title='点击重播这一句 (按 → 或 滚轮向后：掌握下一句；按 ← 或 滚轮向前：生词重播)'
          >
            <div className='flex flex-col gap-1 items-center shrink-0 select-none'>
              <span className='text-[11px] text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded font-medium'>
                当前句
              </span>
              <span
                className={`text-[9px] ${
                  currWeight >= 0.4 ? 'text-amber-400' : currWeight >= 0.2 ? 'text-sky-300' : 'text-emerald-400'
                }`}
                title='基于词频熟练度计算的生词度'
              >
                {(currWeight * 100).toFixed(0)}% 生词
              </span>
            </div>

            <div className='flex-1 min-w-0'>
              {/* 大字号高对比度主文本 */}
              <div className='text-xl font-medium text-white leading-relaxed tracking-wide'>
                {renderTokens(currSub.text1, (word) => onWordClick(word, currSub.text1))}
              </div>
              {currSub.text2 && (
                <div className='text-sm text-sky-200/80 mt-1 leading-snug'>
                  {currSub.text2}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 下一句 */}
        {nextSub && (
          <div
            onClick={() => video_player.player.value?.seekTo(nextSub.start, true)}
            className='flex items-baseline gap-2.5 cursor-pointer py-1 px-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity'
            title='点击跳转至下一句 (快捷键: → 或 滚轮向后)'
          >
            <span className='text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.5 rounded select-none font-medium shrink-0'>
              下一句
            </span>
            <div className='flex-1 min-w-0'>
              <div className='text-sm text-slate-300 leading-snug'>
                {nextSub.text1}
              </div>
              {nextSub.text2 && (
                <div className='text-xs text-slate-400 mt-0.5 leading-snug'>
                  {nextSub.text2}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function renderTokens(text: string, onWordClick: (w: string) => void)
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
        const stat = video_list.data.value.word_stat[cleanWord]
        const style = getWordStyle(stat)

        items.push(
          <span
            key={i++}
            onClick={(e) =>
            {
              e.stopPropagation()
              onWordClick(cleanWord)
            }}
            className='cursor-pointer rounded px-0.5 transition-colors hover:bg-white/20'
            style={style}
            title={
              stat?.pass
                ? `${segment} [已掌握 Pass]`
                : stat
                ? `${segment} (Fail: ${stat.fail}, Success: ${stat.success}) 点击查词`
                : `${segment} (未打卡) 点击查词`
            }
          >
            {segment}
          </span>
        )
      }
      else
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
      const stat = video_list.data.value.word_stat[cleanWord]
      const style = getWordStyle(stat)

      return (
        <span
          key={i}
          onClick={(e) =>
          {
            e.stopPropagation()
            onWordClick(cleanWord)
          }}
          className='cursor-pointer rounded px-0.5 transition-colors hover:bg-white/20'
          style={style}
          title={
            stat?.pass
              ? `${part} [已掌握 Pass]`
              : stat
              ? `${part} (Fail: ${stat.fail}, Success: ${stat.success}) 点击查词`
              : `${part} (未打卡) 点击查词`
          }
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}
