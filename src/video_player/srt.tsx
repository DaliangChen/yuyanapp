import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
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
  const activeRef = useRef<HTMLDivElement>(null)
  const userScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | null>(null)
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
      // Find overlapping translation in subs2
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

  const activeIndex = pairedSubtitles.findIndex(
    sub => video_player.current_time.value >= sub.start && video_player.current_time.value <= sub.end,
  )

  // Single-sentence loop check
  useEffect(() =>
  {
    if (video_player.loop_current_sentence.value && activeIndex !== -1)
    {
      const currentSub = pairedSubtitles[activeIndex]
      if (currentSub && video_player.current_time.value >= currentSub.end - 0.15)
      {
        video_player.player.value?.seekTo(currentSub.start, true)
      }
    }
  }, [video_player.current_time.value, activeIndex, video_player.loop_current_sentence.value, pairedSubtitles])

  // Pause auto-scroll when user manually scrolls
  const handleScroll = () =>
  {
    userScrollingRef.current = true
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = window.setTimeout(() =>
    {
      userScrollingRef.current = false
    }, 3000)
  }

  useEffect(() =>
  {
    if (!userScrollingRef.current && activeRef.current)
    {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeIndex])

  const subMode = video_player.subtitle_mode.value

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

  return (
    <div
      style={{
        gridArea: 'sidebar',
        height: '100%',
        overflow: 'hidden',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e0e0e0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h5 style={{ margin: 0, fontSize: '15px' }}>Subtitles ({pairedSubtitles.length})</h5>
        <span style={{ fontSize: '12px', color: '#888' }}>
          💡 Click a word to review
        </span>
      </div>

      <div
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', borderRadius: '8px', paddingRight: '4px' }}
      >
        {pairedSubtitles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#999' }}>
            <p>No subtitles loaded for this video.</p>
            <p style={{ fontSize: '13px' }}>Return to the list and click "Load" to import an .srt or .vtt file.</p>
          </div>
        ) : (
          pairedSubtitles.map((sub, index) =>
          {
            const isActive = index === activeIndex
            return (
              <div
                key={index}
                ref={isActive ? activeRef : null}
                onClick={() => video_player.player.value?.seekTo(sub.start, true)}
                style={{
                  userSelect: 'text',
                  padding: '10px 14px',
                  margin: '6px 0',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#e3f2fd' : '#f9f9f9',
                  borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                  color: isActive ? '#0d47a1' : '#333',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                {/* Primary text */}
                {(subMode === 'bilingual' || subMode === 'srt_1') && sub.text1 && (
                  <div style={{ fontSize: '15px', fontWeight: isActive ? 600 : 400, lineHeight: 1.4 }}>
                    {renderTokens(sub.text1, (word) => onWordClick(word, sub.text1))}
                  </div>
                )}

                {/* Secondary text */}
                {(subMode === 'bilingual' || subMode === 'srt_2') && sub.text2 && (
                  <div
                    style={{
                      fontSize: '13px',
                      color: isActive ? '#1565c0' : '#777',
                      marginTop: (subMode === 'bilingual' && sub.text1) ? '4px' : '0',
                      lineHeight: 1.3,
                    }}
                  >
                    {sub.text2}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Word Quick Review Card */}
      {selectedWord && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '15px' }}>{selectedWord.word}</strong>
            <button
              className='outline secondary'
              style={{ padding: '2px 6px', fontSize: '11px', margin: 0 }}
              onClick={() => setSelectedWord(null)}
            >
              ✕
            </button>
          </div>
          <div style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
            {(() =>
            {
              const stat = video_list.data.value.word_stat[selectedWord.word.toLowerCase()]
              return stat
                ? `Familiarity: Known ${stat.success} time(s) / Reviewed ${stat.fail} time(s)`
                : 'Not in vocabulary list yet'
            })()}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button
              className='outline'
              style={{ padding: '3px 8px', fontSize: '12px', margin: 0 }}
              onClick={() => pronounceWord(selectedWord.word)}
            >
              🔊 Listen
            </button>
            <button
              className='outline'
              style={{ padding: '3px 8px', fontSize: '12px', margin: 0, color: '#2e7d32', borderColor: '#2e7d32' }}
              onClick={() => markWord('success')}
            >
              ✓ Known
            </button>
            <button
              className='outline'
              style={{ padding: '3px 8px', fontSize: '12px', margin: 0, color: '#e65100', borderColor: '#e65100' }}
              onClick={() => markWord('fail')}
            >
              ⭐ Review
            </button>
          </div>
        </div>
      )}
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
            borderBottom: isLearning ? '2px dashed #f57c00' : isKnown ? '1px dotted #4caf50' : 'none',
            borderRadius: '2px',
            padding: '0 1px',
          }}
          title={stat ? `Known: ${stat.success}, Need Review: ${stat.fail}` : 'Click to inspect/learn'}
        >
          {part}
        </span>
      )
    }
    return part
  })
}
