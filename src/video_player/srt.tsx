import { useMemo } from 'preact/hooks'
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
    if (stat?.pass || (stat && stat.fail === 0 && stat.success > 0))
    {
      // 标记为 Pass，或者已打卡掌握且无错误 (fail === 0)：生词度为 0
      sumUnfamiliarity += 0
    } else if (stat && (stat.success > 0 || stat.fail > 0))
    {
      // 存在生词记录：按实际生词错误率 fail / (fail + success)
      sumUnfamiliarity += stat.fail / (stat.fail + stat.success)
    } else
    {
      // 未打卡过的词：赋予初始生词权重
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

  // 当前正在播放的句子
  const currSub = activeIndex >= 0 && activeIndex < pairedSubtitles.length ? pairedSubtitles[activeIndex] : null

  const currWeight = currSub ? calculateSentenceWeight(currSub.text1, wordStat) : 0

  return (
    <div className='w-full bg-slate-50/70 border-t border-slate-200 p-2.5 sm:p-3.5 flex flex-col gap-2 relative shrink-0'>
      {/* 当前句字幕区 - 外框与白色卡片永久常驻，跳转时绝不坍塌或消失 */}
      <div className='w-full'>
        <div
          onClick={() => currSub && video_player.player.value?.seekTo(currSub.start, true)}
          className={`flex items-baseline gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border-l-4 border-slate-800 shadow-2xs border border-slate-200/90 min-h-[86px] sm:min-h-[92px] transition-colors ${
            currSub ? 'cursor-pointer hover:bg-slate-50/90' : 'cursor-default'
          }`}
          title={
            currSub
              ? '点击重播这一句 (快捷键：按 → 下一句；按 ← 上一句重播；滚轮只打分不跳句)'
              : undefined
          }
        >
          <div className='flex flex-col gap-1 items-center shrink-0 select-none min-w-[50px]'>
            <span className='text-[11px] text-slate-900 bg-slate-100 font-semibold px-2 py-0.5 rounded-md'>
              当前句
            </span>
            <span
              className={`text-[10px] font-mono ${
                currSub
                  ? currWeight >= 0.4
                    ? 'text-amber-700'
                    : currWeight >= 0.2
                    ? 'text-slate-600'
                    : 'text-emerald-700'
                  : 'text-slate-300'
              }`}
              title='基于词频熟练度计算的生词度'
            >
              {currSub ? `${(currWeight * 100).toFixed(0)}% 生词` : '—'}
            </span>
          </div>

          <div className='flex-1 min-w-0 flex flex-col justify-center min-h-[44px]'>
            {pairedSubtitles.length === 0 ? (
              <div className='text-slate-400 text-xs italic py-1'>
                暂无已加载的字幕文件，请先在视频列表载入 SRT/VTT 字幕
              </div>
            ) : currSub ? (
              <>
                {/* 大字号清晰主文本 */}
                <div className='text-lg sm:text-xl md:text-[22px] font-semibold text-slate-900 leading-snug tracking-wide'>
                  {renderTokens(currSub.text1)}
                </div>
                {currSub.text2 && (
                  <div className='text-sm sm:text-base md:text-lg text-slate-700 font-medium mt-1 leading-snug tracking-normal'>
                    {currSub.text2}
                  </div>
                )}
              </>
            ) : (
              <div className='text-slate-400 text-xs italic py-1'>
                等待当前字幕播放...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
        const stat = app.data.value.word_stat[cleanWord]
        const style = getWordStyle(stat)

        items.push(
          <span
            key={i++}
            className='px-0.5 rounded select-text'
            style={style}
            title={
              stat?.pass
                ? `${segment} [已掌握 Pass]`
                : stat
                ? `${segment} (生词: ${stat.fail}, 掌握: ${stat.success})`
                : undefined
            }
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
          className='px-0.5 rounded select-text'
          style={style}
          title={
            stat?.pass
              ? `${part} [已掌握 Pass]`
              : stat
              ? `${part} (生词: ${stat.fail}, 掌握: ${stat.success})`
              : undefined
          }
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}
