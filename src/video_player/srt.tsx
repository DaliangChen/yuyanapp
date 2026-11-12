import { useEffect, useMemo, useRef } from 'preact/hooks'
import * as app from '../appv'
import type { Subtitle } from '../util'
import * as video_player from './value'

export function SrtPart()
{
  const list_ref_dom = useRef<HTMLDivElement>(null)
  const item_refs = useRef<(HTMLElement | null)[]>([])

  const sentences = video_player.video_info.value?.sentense_list ?? []
  const currentTime = video_player.current_time.value

  // Find active sentence index according to current playback time
  const activeIndex = useMemo(() =>
  {
    if (sentences.length === 0) return -1

    // Exact match: current_time falls between start_time and end_time
    const exact = sentences.findIndex(
      (s) => currentTime >= s.start_time && currentTime <= s.end_time,
    )
    if (exact !== -1) return exact

    // If within a short gap right after a sentence, keep it active
    for (let i = 0; i < sentences.length; i++)
    {
      const s = sentences[i]
      if (currentTime >= s.start_time && currentTime - s.end_time < 0.5)
      {
        return i
      }
    }

    return -1
  }, [currentTime, sentences])

  // Smoothly scroll the container so the active subtitle is centered
  useEffect(() =>
  {
    if (activeIndex < 0) return
    const container = list_ref_dom.current
    const activeEl = item_refs.current[activeIndex]
    if (!container || !activeEl) return

    const targetTop = activeEl.offsetTop
    const targetHeight = activeEl.offsetHeight
    const containerHeight = container.clientHeight
    const targetScrollTop = targetTop - (containerHeight / 2) + (targetHeight / 2)

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    })
  }, [activeIndex])

  // Handle "Skip familiar" mode if enabled
  useEffect(() =>
  {
    if (!video_player.is_skip_familiar.value || !video_player.is_playing.value) return
    if (activeIndex < 0) return

    const currentSentence = sentences[activeIndex]
    if (!currentSentence || currentSentence.words.length === 0) return

    const isAllFamiliar = currentSentence.words.every((w) => app.data.value.word_stat[w] === true)
    if (!isAllFamiliar) return

    // Find next sentence with at least one unfamiliar word
    const nextUnfamiliar = sentences.slice(activeIndex + 1).find((s) =>
      s.words.some((w) => !app.data.value.word_stat[w]),
    )

    if (nextUnfamiliar)
    {
      video_player.player.value?.seekTo(nextUnfamiliar.start_time, true)
      video_player.current_time.value = nextUnfamiliar.start_time
    }
  }, [activeIndex, video_player.is_skip_familiar.value, video_player.is_playing.value])

  if (!video_player.video_info.value)
  {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--pico-muted-color)' }}>
        No video selected
      </div>
    )
  }

  if (sentences.length === 0)
  {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--pico-muted-color)' }}>
        <p>No subtitles loaded for this video.</p>
        <button
          className='outline'
          style={{ width: 'auto' }}
          onClick={() => (app.show_page.value = 'video_list')}
        >
          Load Subtitles in Video List
        </button>
      </div>
    )
  }

  return (
    <div
      ref={list_ref_dom}
      style={{
        position: 'relative',
        height: 'calc(100vh - 130px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        paddingRight: '6px',
        boxSizing: 'border-box',
      }}
    >
      {sentences.map((sentense, index) =>
      {
        const isActive = index === activeIndex

        return (
          <article
            key={sentense.index}
            ref={(el) => { item_refs.current[index] = el }}
            onClick={() => on_click_sentence(sentense)}
            style={{
              cursor: 'pointer',
              marginBottom: 0,
              padding: '12px 16px',
              borderRadius: '8px',
              border: isActive
                ? '2px solid var(--pico-primary)'
                : '1px solid var(--pico-card-border-color, rgba(127,127,127,0.2))',
              backgroundColor: isActive
                ? 'var(--pico-card-sectionning-background-color, var(--pico-card-background-color))'
                : 'inherit',
              boxShadow: isActive ? '0 0 10px rgba(0, 120, 255, 0.2)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
                fontSize: '0.75rem',
                color: isActive ? 'var(--pico-primary)' : 'var(--pico-muted-color)',
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              <span>{isActive ? '▶ Playing' : `#${sentense.index}`}</span>
              <span>{sentense.start_time_str} → {sentense.end_time_str}</span>
            </div>

            <div
              style={{
                fontSize: '1rem',
                lineHeight: '1.4',
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {sentense.text}
            </div>

            {sentense.translation && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--pico-muted-color)',
                }}
              >
                {sentense.translation}
              </div>
            )}

            {sentense.words && sentense.words.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {sentense.words.map((word) =>
                {
                  const isPassed = app.data.value.word_stat[word] === true
                  return (
                    <span
                      key={word}
                      onClick={(e) =>
                      {
                        e.stopPropagation()
                        on_toggle_word(word)
                      }}
                      title={isPassed ? `${word} (Mastered - click to review)` : `${word} (Review - click to mark mastered)`}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: isPassed ? 'rgba(46, 160, 67, 0.15)' : 'rgba(235, 87, 87, 0.15)',
                        color: isPassed ? '#2ea043' : '#eb5757',
                        border: `1px solid ${isPassed ? '#2ea043' : '#eb5757'}`,
                      }}
                    >
                      {word} {isPassed ? '✓' : '●'}
                    </span>
                  )
                })}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function on_click_sentence(sentense: Subtitle)
{
  video_player.player.value?.seekTo(sentense.start_time, true)
  video_player.current_time.value = sentense.start_time
  if (!video_player.is_playing.value)
  {
    video_player.is_playing.value = true
  }
}

function on_toggle_word(word: string)
{
  const current = app.data.value.word_stat[word]
  const new_stat = { ...app.data.value.word_stat, [word]: !current }
  app.data.value = { ...app.data.value, word_stat: new_stat }
}
