import { useEffect } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import { app } from '../appv'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { SrtPart } from './srt'
import { video_player } from './value'

export function VideoPlayerPage()
{
  useInit()
  useKeyboardShortcuts()

  if (!video_player.video_info.value)
  {
    app.show_page.value = 'video_list'
    return null
  }

  return (
    <div className='player-container'>
      <PlayerPart />
      <ControlPart />
      <SrtPart />
    </div>
  )
}

function useInit()
{
  useEffect(() =>
  {
    const videoId = video_player.video_info.value?.video_id
    const player = YouTubePlayer('video_player', {
      playerVars: {
        autoplay: 0,
        rel: 0,
      },
    })
    video_player.player.value = player

    if (videoId)
    {
      player.loadVideoById(videoId)
    }

    // Listen to player state changes
    // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
    player.on('stateChange', (event: { data: number }) =>
    {
      video_player.is_playing.value = event.data === 1
    })

    const interval_id = setInterval(async () =>
    {
      try
      {
        video_player.current_time.value = (await video_player.player.value?.getCurrentTime()) ?? 0
      }
      catch
      {
        // Ignore during player destroy/transition
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
    const handleKeyDown = async (e: KeyboardEvent) =>
    {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (e.code === 'Space')
      {
        e.preventDefault()
        if (video_player.is_playing.value)
        {
          video_player.player.value?.pauseVideo()
        }
        else
        {
          video_player.player.value?.playVideo()
        }
      }
      else if (e.code === 'ArrowLeft')
      {
        e.preventDefault()
        const current = (await video_player.player.value?.getCurrentTime()) ?? video_player.current_time.value
        video_player.player.value?.seekTo(Math.max(0, current - 5), true)
      }
      else if (e.code === 'ArrowRight')
      {
        e.preventDefault()
        const current = (await video_player.player.value?.getCurrentTime()) ?? video_player.current_time.value
        video_player.player.value?.seekTo(current + 5, true)
      }
      else if (e.key === 'r' || e.key === 'R' || e.key === 'l' || e.key === 'L')
      {
        video_player.loop_current_sentence.value = !video_player.loop_current_sentence.value
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
