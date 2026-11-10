import { useMemo, useState } from 'preact/hooks'
import { app } from '../appv'
import type { WordStatItem } from '../util'
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
    } else if (stat)
    {
      const unfam = (stat.fail + 1) / (stat.success + stat.fail + 2)
      sumUnfamiliarity += unfam
    } else
    {
      sumUnfamiliarity += 0.5
    }
  }

  return sumUnfamiliarity / words.length
}

/**
 * 查找上一个实际可播放/未被自动跳过的句子索引
 * 若开启跳过逻辑，跳过所有生词度低于 threshold 的句子，精确定位“刚刚播放完的上一句”
 */
export function findPrevPlayableIndex(
  subs: Array<{ text1?: string; text?: string }>,
  currentIdx: number,
  isAutoSkip: boolean,
  threshold: number,
  wordStat: Record<string, WordStatItem>,
): number
{
  if (currentIdx <= 0) return -1
  if (!isAutoSkip) return currentIdx - 1

  for (let i = currentIdx - 1; i >= 0; i--)
  {
    const text = subs[i].text1 ?? subs[i].text ?? ''
    const weight = calculateSentenceWeight(text, wordStat)
    if (weight >= threshold)
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
  threshold: number,
  wordStat: Record<string, WordStatItem>,
): number
{
  if (currentIdx < 0 || currentIdx >= subs.length - 1) return -1
  if (!isAutoSkip) return currentIdx + 1

  for (let i = currentIdx + 1; i < subs.length; i++)
  {
    const text = subs[i].text1 ?? subs[i].text ?? ''
    const weight = calculateSentenceWeight(text, wordStat)
    if (weight >= threshold)
    {
      return i
    }
  }
  return -1
}

/**
 * 单词根据 fail 比例动态计算深浅颜色（素雅白底版本）
 * fail 越多，偏向赭石暖砖红；pass 则淡灰
 */
export function getWordStyle(stat: WordStatItem | undefined)
{
  if (stat?.pass)
  {
    return {
      color: '#94a3b8',
      textDecoration: 'line-through',
    }
  }

  if (!stat || (stat.success === 0 && stat.fail === 0))
  {
    return {
      color: '#0f172a',
    }
  }

  const total = stat.success + stat.fail
  const failRate = stat.fail / total

  if (failRate >= 0.6 || stat.fail >= 3)
  {
    return {
      color: '#b91c1c',
      fontWeight: '600',
      borderBottom: '2px solid rgba(185, 28, 28, 0.7)',
    }
  } else if (failRate >= 0.3 || stat.fail >= 1)
  {
    return {
      color: '#c2410c',
      fontWeight: '500',
      borderBottom: '1.5px dashed rgba(194, 65, 12, 0.7)',
    }
  } else
  {
    return {
      color: '#15803d',
      fontWeight: '500',
      borderBottom: '1px dotted rgba(21, 128, 61, 0.6)',
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

  const wordStat = app.data.value.word_stat || {}
  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value

  // 上一句：如果在自动跳过模式下，取上一个未被跳过、刚刚播放过的上一句
  const prevIdx = findPrevPlayableIndex(pairedSubtitles, activeIndex, isAutoSkip, threshold, wordStat)
  const prevSub = prevIdx !== -1 && prevIdx < activeIndex ? pairedSubtitles[prevIdx] : null

  // 当前句
  const currSub = activeIndex >= 0 && activeIndex < pairedSubtitles.length ? pairedSubtitles[activeIndex] : null

  // 下一句：如果在自动跳过模式下，取下一个真正会播的句子
  const nextIdx = findNextPlayableIndex(pairedSubtitles, activeIndex, isAutoSkip, threshold, wordStat)
  const nextSub = nextIdx !== -1 ? pairedSubtitles[nextIdx] : null

  const currWeight = currSub ? calculateSentenceWeight(currSub.text1, wordStat) : 0
  const isAutoSkipActive = isAutoSkip && currWeight < threshold

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
    app.data.value = {
      ...app.data.value,
      word_stat: { ...wordStat },
    }
  }

  const togglePassWord = () =>
  {
    if (!selectedWord) return
    const w = selectedWord.word.toLowerCase()
    const stat = wordStat[w] || { success: 0, fail: 0 }
    stat.pass = !stat.pass
    wordStat[w] = stat
    app.data.value = {
      ...app.data.value,
      word_stat: { ...wordStat },
    }
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
    return (
      <div className='w-full bg-slate-50/70 border-t border-slate-200 p-6 text-center text-slate-400 text-xs'>
        暂无已加载的字幕文件，请先在视频列表载入 SRT/VTT 字幕
      </div>
    )
  }

  // If auto-skip is triggered for this sentence, don't show to maintain clean flow
  if (isAutoSkipActive)
  {
    return null
  }

  return (
    <div className='w-full bg-slate-50/70 border-t border-slate-200 p-4 sm:p-6 flex flex-col gap-3 relative'>
      {/* Word Quick Review Card - 素雅白底微卡片 */}
      {selectedWord && (
        <div className='mb-2 p-4 bg-white rounded-xl border border-slate-200 shadow-md text-xs text-slate-800 max-w-md w-full mx-auto animate-in fade-in zoom-in-95 duration-100'>
          <div className='flex justify-between items-center pb-2.5 border-b border-slate-100'>
            <div className='flex items-center gap-2.5'>
              <span className='text-lg font-semibold text-slate-900 font-serif'>{selectedWord.word}</span>
              <button
                type='button'
                onClick={() => pronounceWord(selectedWord.word)}
                className='text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-sm p-1'
                title='朗读德语发音'
              >
                🔊
              </button>
            </div>
            <button
              type='button'
              onClick={() => setSelectedWord(null)}
              className='text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs p-1'
            >
              ✕
            </button>
          </div>

          <div className='py-2.5 text-xs text-slate-600 flex items-center justify-between'>
            {(() =>
            {
              const stat = wordStat[selectedWord.word.toLowerCase()]
              if (!stat) return <span className='text-slate-400'>生词本中尚无记录</span>
              return (
                <div className='flex items-center gap-3'>
                  <span>
                    掌握: <strong className='text-emerald-600 font-mono text-sm'>{stat.success}</strong> 次
                  </span>
                  <span>
                    生词: <strong className='text-amber-700 font-mono text-sm'>{stat.fail}</strong> 次
                  </span>
                  {stat.pass && <span className='text-emerald-700 font-medium'>[已掌握 Pass]</span>}
                </div>
              )
            })()}
          </div>

          <div className='flex items-center gap-2 pt-2.5 border-t border-slate-100'>
            <button
              type='button'
              onClick={() => markWord('success')}
              className='flex-1 py-1.5 px-3 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer'
            >
              ✓ 认识 (+1)
            </button>
            <button
              type='button'
              onClick={() => markWord('fail')}
              className='flex-1 py-1.5 px-3 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors cursor-pointer'
            >
              ⭐ 生词 (+1)
            </button>
            <button
              type='button'
              onClick={togglePassWord}
              className='py-1.5 px-3 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer'
            >
              {wordStat[selectedWord.word.toLowerCase()]?.pass ? '取消 Pass' : '已掌握 Pass'}
            </button>
          </div>
        </div>
      )}

      {/* 3-Sentence Subtitle Container - 位于控制栏底部的素雅大字号字幕区 */}
      <div className='w-full flex flex-col gap-2.5'>
        {/* 1. 上一句 (在跳过模式下为刚刚播放完的上一句) */}
        {prevSub && (
          <div
            onClick={() => video_player.player.value?.seekTo(prevSub.start, true)}
            className='flex items-baseline gap-3 cursor-pointer py-2 px-3 rounded-xl opacity-60 hover:opacity-100 hover:bg-white/70 transition-all'
            title='点击跳转至上一句 (快捷键: ← 或 滚轮向前推)'
          >
            <span className='text-[11px] text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded select-none font-medium shrink-0'>
              上一句
            </span>
            <div className='flex-1 min-w-0'>
              <div className='text-sm sm:text-base text-slate-600 leading-relaxed'>
                {prevSub.text1}
              </div>
              {prevSub.text2 && (
                <div className='text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed'>
                  {prevSub.text2}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 这一句 (大字号高对比度醒目展示) */}
        {currSub && (
          <div
            onClick={() => video_player.player.value?.seekTo(currSub.start, true)}
            className='flex items-baseline gap-4 cursor-pointer p-4 sm:p-5 rounded-2xl bg-white border-l-4 border-slate-800 shadow-xs border border-slate-200/90 transition-all hover:bg-slate-50/90'
            title='点击重播这一句 (按 → 或 滚轮向后勾：掌握当前句跳下一句；按 ← 或 滚轮向前推：上一句记生词并重播)'
          >
            <div className='flex flex-col gap-1.5 items-center shrink-0 select-none'>
              <span className='text-xs text-slate-900 bg-slate-100 font-semibold px-2.5 py-1 rounded-md'>
                当前句
              </span>
              <span
                className={`text-[10px] font-mono ${
                  currWeight >= 0.4 ? 'text-amber-700' : currWeight >= 0.2 ? 'text-slate-600' : 'text-emerald-700'
                }`}
                title='基于词频熟练度计算的生词度'
              >
                {(currWeight * 100).toFixed(0)}% 生词
              </span>
            </div>

            <div className='flex-1 min-w-0'>
              {/* 大字号清晰主文本 */}
              <div className='text-xl sm:text-2xl md:text-[26px] font-semibold text-slate-900 leading-relaxed tracking-wide'>
                {renderTokens(currSub.text1, (word) => onWordClick(word, currSub.text1))}
              </div>
              {currSub.text2 && (
                <div className='text-sm sm:text-base text-slate-500 mt-2 leading-relaxed'>
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
            className='flex items-baseline gap-3 cursor-pointer py-2 px-3 rounded-xl opacity-60 hover:opacity-100 hover:bg-white/70 transition-all'
            title='点击跳转至下一句 (快捷键: → 或 滚轮向后勾)'
          >
            <span className='text-[11px] text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded select-none font-medium shrink-0'>
              下一句
            </span>
            <div className='flex-1 min-w-0'>
              <div className='text-sm sm:text-base text-slate-600 leading-relaxed'>
                {nextSub.text1}
              </div>
              {nextSub.text2 && (
                <div className='text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed'>
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
        const stat = app.data.value.word_stat[cleanWord]
        const style = getWordStyle(stat)

        items.push(
          <span
            key={i++}
            onClick={(e) =>
            {
              e.stopPropagation()
              onWordClick(cleanWord)
            }}
            className='cursor-pointer rounded px-0.5 transition-colors hover:bg-slate-200/70'
            style={style}
            title={stat?.pass
              ? `${segment} [已掌握 Pass]`
              : stat
              ? `${segment} (Fail: ${stat.fail}, Success: ${stat.success}) 点击查词`
              : `${segment} (未打卡) 点击查词`}
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
      const stat = app.data.value.word_stat[cleanWord]
      const style = getWordStyle(stat)

      return (
        <span
          key={i}
          onClick={(e) =>
          {
            e.stopPropagation()
            onWordClick(cleanWord)
          }}
          className='cursor-pointer rounded px-0.5 transition-colors hover:bg-slate-200/70'
          style={style}
          title={stat?.pass
            ? `${part} [已掌握 Pass]`
            : stat
            ? `${part} (Fail: ${stat.fail}, Success: ${stat.success}) 点击查词`
            : `${part} (未打卡) 点击查词`}
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}
