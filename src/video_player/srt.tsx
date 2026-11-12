import { computed } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import * as app from '../appv'
import type { Subtitle } from '../util'
import * as video_player from './value'

const sentences = computed(() => video_player.video_info.value?.sentense_list ?? [])
const current_time = computed(() => video_player.current_time.value)
const active_index = computed(() =>
{
  if (sentences.value.length === 0) return -1

  const exact = sentences.value.findIndex(
    (s) => current_time.value >= s.start_time && current_time.value <= s.end_time,
  )
  if (exact !== -1) return exact

  for (let i = 0; i < sentences.value.length; i++)
  {
    const s = sentences.value[i]
    if (current_time.value >= s.start_time && current_time.value - s.end_time < 0.5)
    {
      return i
    }
  }

  return -1
})

export function SrtPart()
{
  const list_ref_dom = useRef<HTMLDivElement>(null)
  const item_refs = useRef<(HTMLElement | null)[]>([])

  useEffect(() =>
  {
    if (active_index.value < 0) return
    const container = list_ref_dom.current
    const activeEl = item_refs.current[active_index.value]
    if (!container || !activeEl) return

    const targetTop = activeEl.offsetTop
    const targetHeight = activeEl.offsetHeight
    const containerHeight = container.clientHeight
    const targetScrollTop = targetTop - (containerHeight / 2) + (targetHeight / 2)

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    })
  }, [active_index.value])

  useEffect(() =>
  {
    if (!video_player.is_skip_familiar.value || !video_player.is_playing.value) return
    if (active_index.value < 0) return

    const currentSentence = sentences.value[active_index.value]
    if (!currentSentence || currentSentence.words.length === 0) return

    const isAllFamiliar = currentSentence.words.every((w) => app.data.value.word_stat[w] === true)
    if (!isAllFamiliar) return

    const nextUnfamiliar = sentences.value.slice(active_index.value + 1).find((s) =>
      s.words.some((w) => !app.data.value.word_stat[w])
    )

    if (nextUnfamiliar)
    {
      video_player.player.value?.seekTo(nextUnfamiliar.start_time, true)
      video_player.current_time.value = nextUnfamiliar.start_time
    }
  }, [active_index.value, video_player.is_skip_familiar.value, video_player.is_playing.value])

  return (
    <div
      ref={list_ref_dom}
      style={{
        position: 'relative',
        height: 'calc(100vh - 82px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        paddingRight: '6px',
        boxSizing: 'border-box',
      }}
    >
      {sentences.value.map((sentense, index) =>
      {
        const isActive = index === active_index.value

        return (
          <article
            key={sentense.index}
            ref={(el) =>
            {
              item_refs.current[index] = el
            }}
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

            <div style={{ fontSize: '1rem', lineHeight: '1.4', fontWeight: isActive ? 'bold' : 'normal' }}>
              {sentense.text}
            </div>

            <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--pico-muted-color)' }}>
              {sentense.translation}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {sentense.words
                .filter((word) => !app.data.value.word_stat[word])
                .map((word, word_index) =>
                {
                  return (
                    <span
                      key={word + word_index}
                      onClick={(e) =>
                      {
                        e.stopPropagation()
                        on_toggle_word(word)
                      }}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(46, 160, 67, 0.15)',
                        color: '#2ea043',
                        border: '1px solid #2ea043',
                      }}
                    >
                      {word}
                    </span>
                  )
                })}
            </div>
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
