import { useEffect, useMemo, useRef } from 'preact/hooks'
import * as app from '../appv'
import * as video_player from './value'

export interface Subtitle
{
  start: number
  end: number
  text1: string
  text2?: string
}

export function parse_srt(srt: string)
{
  if (!srt) return []
  const pattern = /(?:(\d{1,2}:)?(\d{2}:\d{2}[,.]\d{3}))\s*-->\s*(?:(\d{1,2}:)?(\d{2}:\d{2}[,.]\d{3}))\s*\n([\s\S]*?)(?=\n\s*\n|$)/g
  const to_seconds = (str: string) =>
  {
    const parts = str.replace(',', '.').split(':')
    return parts.length === 3
      ? +parts[0] * 3600 + +parts[1] * 60 + +parts[2]
      : +parts[0] * 60 + +parts[1]
  }

  const list = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(srt.replace(/\r\n/g, '\n'))))
  {
    list.push({
      start: to_seconds((m[1] || '') + m[2]),
      end: to_seconds((m[3] || '') + m[4]),
      text: m[5].replace(/<[^>]+>/g, '').trim(),
    })
  }
  return list
}

export function extract_words(text: string): string[]
{
  const words = text.toLowerCase().match(/[\p{L}0-9'-]+/gu) || []
  return words.map(w => w.replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, '')).filter(Boolean)
}

export function is_sentence_passed(text: string, word_stat: Record<string, boolean>): boolean
{
  const words = extract_words(text)
  return words.length === 0 || words.every(w => word_stat[w] === true)
}

export function skip_if_current_familiar(custom_stat?: Record<string, boolean>)
{
  const srt = video_player.video_info.value?.srt_1 || video_player.video_info.value?.srt_2 || ''
  const subs = parse_srt(srt)
  if (subs.length === 0) return

  const time = video_player.current_time.value
  const word_stat = custom_stat || app.data.value.word_stat || {}

  // 找到当前时间所在的句子或紧接着的句子
  const active_sub = subs.find(s => time >= s.start && time <= s.end) || subs.find(s => s.start >= time)
  if (active_sub && is_sentence_passed(active_sub.text, word_stat))
  {
    const next_unpassed = subs.find(s => s.start > active_sub.start && !is_sentence_passed(s.text, word_stat))
    if (next_unpassed)
    {
      video_player.player.value?.seekTo(next_unpassed.start, true)
    }
  }
}

export function SrtPart()
{
  const list_ref = useRef<HTMLDivElement>(null)
  const active_ref = useRef<HTMLElement | null>(null)

  const all_subtitles = useMemo<Subtitle[]>(() =>
  {
    const s1 = parse_srt(video_player.video_info.value?.srt_1 ?? '')
    const s2 = parse_srt(video_player.video_info.value?.srt_2 ?? '')

    if (s1.length === 0 && s2.length > 0)
    {
      return s2.map(s => ({ start: s.start, end: s.end, text1: '', text2: s.text }))
    }

    return s1.map(item =>
    {
      const match = s2.find(s => Math.max(item.start, s.start) < Math.min(item.end, s.end))
      return { start: item.start, end: item.end, text1: item.text, text2: match?.text }
    })
  }, [video_player.video_info.value?.srt_1, video_player.video_info.value?.srt_2])

  const word_stat = app.data.value.word_stat || {}
  const is_auto_skip = video_player.auto_skip_familiar.value

  const subtitles = useMemo(() =>
  {
    if (!is_auto_skip) return all_subtitles
    return all_subtitles.filter(sub => !is_sentence_passed(sub.text1, word_stat))
  }, [all_subtitles, is_auto_skip, word_stat])

  const time = video_player.current_time.value
  let active_index = subtitles.findIndex(s => time >= s.start && time <= s.end)
  if (active_index === -1 && subtitles.length > 0)
  {
    const next = subtitles.findIndex(s => s.start > time)
    if (next > 0) active_index = next - 1
  }

  // 随视频播放上下平滑自动滚动居中
  useEffect(() =>
  {
    if (active_ref.current && list_ref.current)
    {
      const container = list_ref.current
      const el = active_ref.current
      const top = el.offsetTop - container.offsetTop
      container.scrollTo({
        top: Math.max(0, top - container.clientHeight / 2 + el.offsetHeight / 2),
        behavior: 'smooth',
      })
    }
  }, [active_index])

  const on_toggle_word = (e: MouseEvent, word: string) =>
  {
    e.stopPropagation()
    const stat = { ...app.data.value.word_stat }
    stat[word] = !stat[word]
    app.data.value = { ...app.data.value, word_stat: stat }

    if (video_player.auto_skip_familiar.value)
    {
      skip_if_current_familiar(stat)
    }
  }

  if (all_subtitles.length === 0)
  {
    return (
      <article style={{ textAlign: 'center', color: 'var(--pico-muted-color)' }}>
        No subtitles loaded. Please import subtitles in Video List.
      </article>
    )
  }

  if (subtitles.length === 0)
  {
    return (
      <article style={{ textAlign: 'center', color: 'var(--pico-muted-color)' }}>
        🎉 所有句子均已掌握 (已过滤熟句)
      </article>
    )
  }

  return (
    <div
      ref={list_ref}
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
      {subtitles.map((sub, idx) =>
      {
        const is_active = idx === active_index
        const is_passed = is_sentence_passed(sub.text1, word_stat)

        return (
          <article
            key={`${sub.start}-${idx}`}
            ref={is_active ? (el => { active_ref.current = el }) : null}
            onClick={() => video_player.player.value?.seekTo(sub.start, true)}
            style={{
              margin: 0,
              padding: '12px 14px',
              borderRadius: 'var(--pico-border-radius)',
              border: is_active
                ? '2px solid var(--pico-primary)'
                : '1px solid var(--pico-card-border-color, #e0e0e0)',
              backgroundColor: is_active
                ? 'var(--pico-card-background-color)'
                : 'transparent',
              boxShadow: is_active ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'border 0.2s, background-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', lineHeight: 1 }}>
              <span style={{ color: 'var(--pico-muted-color)', fontFamily: 'monospace' }}>
                {format_time(sub.start)} - {format_time(sub.end)}
              </span>
              <span style={{ fontWeight: 700, color: is_passed ? '#2e7d32' : 'var(--pico-primary)' }}>
                {is_passed ? '✓ Passed' : 'Review'}
              </span>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.4 }}>
              <WordTokens text={sub.text1} on_toggle_word={on_toggle_word} />
            </div>

            {sub.text2 && (
              <div style={{ fontSize: '0.88rem', color: 'var(--pico-muted-color)', lineHeight: 1.35 }}>
                {sub.text2}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function WordTokens({ text, on_toggle_word }: { text: string; on_toggle_word: (e: MouseEvent, word: string) => void })
{
  const parts = text.split(/([\p{L}0-9'-]+)/u)

  return (
    <>
      {parts.map((part, i) =>
      {
        if (/^[\p{L}0-9'-]+$/u.test(part))
        {
          const clean = part.toLowerCase().replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, '')
          let pass = app.data.value.word_stat[clean]
          if (pass === undefined)
          {
            pass = false
            app.data.value.word_stat[clean] = false
          }

          return (
            <span
              key={i}
              onClick={(e) => on_toggle_word(e, clean)}
              style={{
                color: pass ? '#000000' : 'var(--pico-primary)',
                fontWeight: pass ? 'normal' : 'bold',
                padding: '1px 3px',
                borderRadius: '3px',
                cursor: 'pointer',
                userSelect: 'text',
              }}
            >
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function format_time(seconds: number): string
{
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
