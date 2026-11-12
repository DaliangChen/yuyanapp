import { useEffect } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import * as video_player from './value'

export function PlayerPart()
{
  useInit()

  usePlayInterval()

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
      <div style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <div id='video_player_div' style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
      </div>
    </div>
  )
}

function usePlayInterval()
{
  useEffect(() =>
  {
    const interval_id = setInterval(async () =>
    {
      const time = (await video_player.player.value?.getCurrentTime()) ?? 0
      video_player.current_time.value = time
    }, 100)

    return () => clearInterval(interval_id)
  }, [])
}

function useInit()
{
  useEffect(() =>
  {
    const player = YouTubePlayer('video_player_div', { playerVars: { autoplay: 0, rel: 0 } })
    video_player.player.value = player

    const video_id = video_player.video_info.value?.video_id
    if (video_id)
    {
      player.loadVideoById(video_id).then(() =>
      {
        player.seekTo(video_player.current_time.value, true)
        player.playVideo()
        video_player.is_playing.value = true
      })
    }

    return () =>
    {
      video_player.player.value?.destroy()
      video_player.player.value = null
      video_player.is_playing.value = false
    }
  }, [])
}
