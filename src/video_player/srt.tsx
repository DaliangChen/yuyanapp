import { useMemo, useState } from 'preact/hooks'
import { video_list } from '../video_list/value'
import { video_player } from './value'

interface SubtitleItem
{
  start: number
  end: number
  text: string
}

interface PairedSubtitle
{
  start: number
  end: number
  text1: string
  text2?: string
}

function parseSRT(srt: string): SubtitleItem[]
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

  // If in gap between subtitles, look for the upcoming or previous subtitle
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

  const onWordClick = (word: string, sentence: string) =>
  {
    setSelectedWord({ word, sentence })
  }

  const markWord = (type: 'success' | 'fail') =>
  {
    if (!selectedWord) return
    const w = selectedWord.word.toLowerCase()
    const stat = video_list.data.value.word_stat[w] || { success: 0, fail: 0 }
    if (type === 'success') stat.success += 1
    else stat.fail += 1

    video_list.data.value.word_stat[w] = stat
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
            padding: '10px 14px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            fontSize: '13px',
            color: '#ffffff',
            maxWidth: '420px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '16px', color: '#38bdf8' }}>{selectedWord.word}</strong>
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
          <div style={{ margin: '4px 0', color: '#94a3b8', fontSize: '12px' }}>
            {(() =>
            {
              const stat = video_list.data.value.word_stat[selectedWord.word.toLowerCase()]
              return stat
                ? `熟练度统计：已掌握 ${stat.success} 次 / 待复习 ${stat.fail} 次`
                : '生词本中尚无记录'
            })()}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              className='outline'
              style={{ padding: '3px 8px', fontSize: '12px', margin: 0, color: '#38bdf8', borderColor: '#38bdf8' }}
              onClick={() => pronounceWord(selectedWord.word)}
            >
              🔊 发音
            </button>
            <button
              className='outline'
              style={{ padding: '3px 8px', fontSize: '12px', margin: 0, color: '#4ade80', borderColor: '#4ade80' }}
              onClick={() => markWord('success')}
            >
              ✓ 认识
            </button>
            <button
              className='outline'
              style={{ padding: '3px 8px', fontSize: '12px', margin: 0, color: '#fb923c', borderColor: '#fb923c' }}
              onClick={() => markWord('fail')}
            >
              ⭐ 标为生词
            </button>
          </div>
        </div>
      )}

      {/* 3-Sentence Subtitle Box */}
      <div
        style={{
          width: 'min(94%, 820px)',
          maxHeight: '46vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '14px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
          padding: '12px 18px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
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
              opacity: 0.7,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            title='点击跳转至上一句'
          >
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '1px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              上一句
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.35 }}>
                {prevSub.text1}
              </div>
              {prevSub.text2 && (
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
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
              gap: '10px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 58, 138, 0.5)',
              borderLeft: '4px solid #38bdf8',
              boxShadow: '0 2px 10px rgba(56, 189, 248, 0.15)',
              transition: 'background 0.2s',
            }}
            title='点击重播这一句'
          >
            <span
              style={{
                fontSize: '11px',
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                userSelect: 'none',
              }}
            >
              这一句
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16.5px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                {renderTokens(currSub.text1, (word) => onWordClick(word, currSub.text1))}
              </div>
              {currSub.text2 && (
                <div style={{ fontSize: '14px', color: '#bae6fd', marginTop: '4px', lineHeight: 1.35 }}>
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
              opacity: 0.7,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            title='点击跳转至下一句'
          >
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '1px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              下一句
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.35 }}>
                {nextSub.text1}
              </div>
              {nextSub.text2 && (
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
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
      const isKnown = stat && stat.success > stat.fail
      const isLearning = stat && stat.fail >= stat.success

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
            borderBottom: isLearning ? '2px dashed #fb923c' : isKnown ? '1px dotted #4ade80' : 'none',
            borderRadius: '2px',
            padding: '0 1px',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title={stat ? `熟练度：已掌握 ${stat.success} 次，需复习 ${stat.fail} 次` : '点击查词/学习'}
        >
          {part}
        </span>
      )
    }
    return part
  })
}
