import { computed, effect } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import * as app from '../appv'
import type { Sentense } from '../util'
import * as video_player from './value'

/**
 * UI上显示的句子列表
 */
const sentence_list = computed(() =>
  video_player.video_info.value?.sentense_list.filter((sentence) =>
  {
    if (!video_player.is_skip_familiar.value) return true
    return sentence.words.some((word) => !app.data.value.word_stat[word])
  }) ?? []
)

/**
 * 当前时间激活的句子的索引
 */
const active_sentence_index = computed(() =>
{
  const exact_subtitle = sentence_list.value.find(
    (sentence) =>
      video_player.current_time.value >= sentence.start_time && video_player.current_time.value <= sentence.end_time,
  )
  if (exact_subtitle) return exact_subtitle.index

  return ''
})

let old_active_sentence_index = 'xxxxxxxxxxxxxxxxxxxxx'

effect(() =>
{
  if (old_active_sentence_index === active_sentence_index.value) return
  old_active_sentence_index = active_sentence_index.value
  const currentSentenceIndex = sentence_list.value.findIndex((s) => s.index === active_sentence_index.value)
  if (currentSentenceIndex === -1 || currentSentenceIndex === sentence_list.value.length - 1) return
  video_player.player.value?.seekTo(sentence_list.value[currentSentenceIndex + 1].start_time, true)
})

export function SrtPart()
{
  const list_ref_dom = useRef<HTMLDivElement>(null)
  const item_refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() =>
  {
    if (!active_sentence_index.value) return
    const container = list_ref_dom.current
    const active_sentense_el = item_refs.current[active_sentence_index.value]
    if (!container || !active_sentense_el) return

    const targetTop = active_sentense_el.offsetTop
    const targetHeight = active_sentense_el.offsetHeight
    const containerHeight = container.clientHeight
    const targetScrollTop = targetTop - (containerHeight / 2) + (targetHeight / 2)

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    })
  }, [active_sentence_index.value])

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
      {sentence_list.value
        .map((sentense) =>
        {
          const isActive = sentense.index === active_sentence_index.value

          return (
            <article
              key={sentense.index}
              ref={(el) =>
              {
                item_refs.current[sentense.index] = el
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

function on_click_sentence(sentense: Sentense)
{
  video_player.player.value?.seekTo(sentense.start_time, true)
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
