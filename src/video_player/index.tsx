import { useEffect, useRef } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import * as app from '../appv'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { extract_words, is_sentence_passed, parse_srt, SrtPart } from './srt'
import * as video_player from './value'

export function VideoPlayerPage()
{
  useInit()
  useKeyboardShortcuts()

  return (
    <div
      id='video-player-page'
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 1fr)',
        gap: '24px',
        alignItems: 'start',
        height: '100%',
      }}
    >
      <PlayerPart />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
        <ControlPart />
        <div style={{ flex: 1, minHeight: 0 }}>
          <SrtPart />
        </div>
      </div>
    </div>
  )
}

function useInit()
{
  const last_skipped_ref = useRef<number | null>(null)

  // 视频中的新词自动录入生词本为未掌握 (false)
  useEffect(() =>
  {
    const srt = video_player.video_info.value?.srt_1 ?? ''
    if (!srt) return

    const subs = parse_srt(srt)
    let has_new = false
    const stat = { ...app.data.value.word_stat }

    for (const s of subs)
    {
      for (const w of extract_words(s.text))
      {
        if (stat[w] === undefined)
        {
          stat[w] = false
          has_new = true
        }
      }
    }

    if (has_new)
    {
      app.data.value = { ...app.data.value, word_stat: stat }
    }
  }, [video_player.video_info.value?.video_id, video_player.video_info.value?.srt_1])

  useEffect(() =>
  {
    const video_id = video_player.video_info.value?.video_id
    const player = YouTubePlayer('video_player_div', {
      playerVars: { autoplay: 0, rel: 0 },
    })
    video_player.player.value = player

    if (video_id) player.loadVideoById(video_id)

    player.on('stateChange', (event: { data: number }) =>
    {
      video_player.is_playing.value = event.data === 1
    })

    const interval_id = setInterval(async () =>
    {
      try
      {
        const time = (await video_player.player.value?.getCurrentTime()) ?? 0
        video_player.current_time.value = time

        // 自动跳过熟句：如当前句所有单词均已掌握，直接跳至下一句生词
        if (video_player.auto_skip_familiar.value)
        {
          const srt = video_player.video_info.value?.srt_1 || video_player.video_info.value?.srt_2 || ''
          const subs = parse_srt(srt)
          const word_stat = app.data.value.word_stat || {}

          const active_sub = subs.find(s => time >= s.start && time <= s.end)
          if (active_sub)
          {
            if (is_sentence_passed(active_sub.text, word_stat))
            {
              if (last_skipped_ref.current !== active_sub.start)
              {
                last_skipped_ref.current = active_sub.start
                const next_unpassed = subs.find(
                  s => s.start > active_sub.start && !is_sentence_passed(s.text, word_stat),
                )
                if (next_unpassed)
                {
                  video_player.player.value?.seekTo(next_unpassed.start, true)
                }
              }
            }
          } else
          {
            if (last_skipped_ref.current !== null)
            {
              const last_sub = subs.find(s => s.start === last_skipped_ref.current)
              if (!last_sub || time < last_sub.start || time > last_sub.end)
              {
                last_skipped_ref.current = null
              }
            }
          }
        }
      } catch
      {
        // 播放器销毁或切换时忽略
      }
    }, 100)

    return () =>
    {
      video_player.player.value?.destroy()
      video_player.player.value = null
      video_player.is_playing.value = false
      clearInterval(interval_id)
    }
  }, [])
}

function useKeyboardShortcuts()
{
  useEffect(() =>
  {
    const handleKeyDown = (e: KeyboardEvent) =>
    {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (e.code === 'Space')
      {
        e.preventDefault()
        if (video_player.is_playing.value) video_player.player.value?.pauseVideo()
        else video_player.player.value?.playVideo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
