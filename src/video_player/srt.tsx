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
 * 科学计算句子生词/难度权重 (0.0 ~ 1.0)
 * 采用贝叶斯拉普拉斯平滑生词概率，pass 标记词为 0
 */
export function calculateSentenceWeight(text: string, wordStat: Record<string, WordStatItem>): number
{
  const words = text.toLowerCase().match(/[a-z0-9'-]+/g) || []
  if (words.length === 0) return 0

  let sumUnfamiliarity = 0
  for (const w of words)
  {
    const cleanWord = w.replace(/^'+|'+$/g, '')
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
 * 单词根据 fail 比例动态计算深浅颜色
 * fail 比例越高，颜色越深、越醒目（深红/橙红）；已掌握/pass 则为淡灰
 */
export function getWordStyle(stat: WordStatItem | undefined)
{
  if (stat?.pass)
  {
    return {
      color: '#94a3b8',
      borderBottom: 'none',
      opacity: 0.8,
    }
  }

  if (!stat || (stat.success === 0 && stat.fail === 0))
  {
    return {
      color: '#ffffff',
      borderBottom: 'none',
    }
  }

  const total = stat.success + stat.fail
  const failRate = stat.fail / total

  if (failRate >= 0.6 || stat.fail >= 3)
  {
    return {
      color: '#ef4444',
      fontWeight: '700',
      borderBottom: '2px solid #ef4444',
      textShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
    }
  }
  else if (failRate >= 0.35 || stat.fail >= 1)
  {
    return {
      color: '#fb923c',
      fontWeight: '600',
      borderBottom: '2px dashed #fb923c',
    }
  }
  else
  {
    return {
      color: '#86efac',
      fontWeight: '500',
      borderBottom: '1px dotted #86efac',
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
      utterance.lang = 'en-US'
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
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 15,
        padding: '0 16px',
      }}
    >
      {/* Word Quick Review Card */}
      {selectedWord && (
        <div
          style={{
            pointerEvents: 'auto',
            marginBottom: '10px',
            padding: '12px 16px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            fontSize: '13px',
            color: '#ffffff',
            maxWidth: '440px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '18px', color: '#38bdf8' }}>{selectedWord.word}</strong>
            <button
              className='outline secondary'
              style={{
                padding: '1px 6px',
                fontSize: '11px',
                margin: 0,
                color: '#94a3b8',
                borderColor: '#475569',
              }}
              onClick={() => setSelectedWord(null)}
            >
              ✕
            </button>
          </div>

          <div style={{ margin: '6px 0', color: '#94a3b8', fontSize: '12px' }}>
            {(() =>
            {
              const stat = wordStat[selectedWord.word.toLowerCase()]
              if (!stat) return '生词本中尚无记录'
              return (
                <span>
                  掌握次数：<strong style={{ color: '#4ade80' }}>{stat.success}</strong> 次 /
                  生词标记：<strong style={{ color: '#ef4444' }}>{stat.fail}</strong> 次
                  {stat.pass && <span style={{ marginLeft: '8px', color: '#16a34a', fontWeight: 600 }}>[已标记掌握 Pass]</span>}
                </span>
              )
            })()}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              className='outline'
              style={{ padding: '4px 10px', fontSize: '12px', margin: 0, color: '#38bdf8', borderColor: '#38bdf8' }}
              onClick={() => pronounceWord(selectedWord.word)}
            >
              🔊 发音
            </button>
            <button
              className='outline'
              style={{ padding: '4px 10px', fontSize: '12px', margin: 0, color: '#4ade80', borderColor: '#4ade80' }}
              onClick={() => markWord('success')}
            >
              ✓ 认识 (+1)
            </button>
            <button
              className='outline'
              style={{ padding: '4px 10px', fontSize: '12px', margin: 0, color: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => markWord('fail')}
            >
              ⭐ 生词 (+1)
            </button>
            <button
              className='outline'
              style={{ padding: '4px 10px', fontSize: '12px', margin: 0, color: '#e2e8f0', borderColor: '#64748b' }}
              onClick={togglePassWord}
            >
              {wordStat[selectedWord.word.toLowerCase()]?.pass ? '取消 Pass' : '✓ 永久 Pass'}
            </button>
          </div>
        </div>
      )}

      {/* 3-Sentence Subtitle Box */}
      <div
        style={{
          width: 'min(94%, 860px)',
          maxHeight: '48vh',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)',
          padding: '14px 20px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* 1. 上一句 */}
        {prevSub && (
          <div
            onClick={() => video_player.player.value?.seekTo(prevSub.start, true)}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              opacity: 0.65,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.65')}
            title='点击跳转至上一句 (快捷键: ← 重播)'
          >
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              上一句
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.4 }}>
                {prevSub.text1}
              </div>
              {prevSub.text2 && (
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
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
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(30, 58, 138, 0.55)',
              borderLeft: '5px solid #38bdf8',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.2)',
              transition: 'background 0.2s',
            }}
            title='点击重播这一句 (按 → 标记掌握并下一句，按 ← 标记生词并重播)'
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '12px',
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  fontWeight: 700,
                  userSelect: 'none',
                }}
              >
                这一句
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: currWeight >= 0.4 ? '#f87171' : currWeight >= 0.2 ? '#fb923c' : '#4ade80',
                  userSelect: 'none',
                }}
                title='基于单词熟练度计算的句子生词度'
              >
                生词度: {(currWeight * 100).toFixed(0)}%
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 大字号高对比度主文本 */}
              <div style={{ fontSize: '21px', fontWeight: 600, color: '#ffffff', lineHeight: 1.45, letterSpacing: '0.2px' }}>
                {renderTokens(currSub.text1, (word) => onWordClick(word, currSub.text1))}
              </div>
              {currSub.text2 && (
                <div style={{ fontSize: '15px', color: '#bae6fd', marginTop: '5px', lineHeight: 1.35 }}>
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
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              opacity: 0.65,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.65')}
            title='点击跳转至下一句 (快捷键: → 掌握下一句)'
          >
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              下一句
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.4 }}>
                {nextSub.text1}
              </div>
              {nextSub.text2 && (
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
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
  const parts = text.split(/([a-zA-Z0-9'-]+)/)
  return parts.map((part, i) =>
  {
    if (/^[a-zA-Z0-9'-]+$/.test(part))
    {
      const cleanWord = part.toLowerCase().replace(/^'+|'+$/g, '')
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
          style={{
            cursor: 'pointer',
            borderRadius: '2px',
            padding: '0 2px',
            transition: 'all 0.15s ease',
            ...style,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title={
            stat?.pass
              ? `${part} [已掌握 Pass]`
              : stat
              ? `${part} (Fail: ${stat.fail}, Success: ${stat.success}) 点击查词`
              : `${part} (未标记) 点击查词`
          }
        >
          {part}
        </span>
      )
    }
    return part
  })
}
