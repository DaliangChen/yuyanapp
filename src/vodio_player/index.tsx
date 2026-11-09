import { useEffect } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { video_player } from './value'

export function VideoPlayerPage()
{
  useInit()

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateAreas: `
                            "video sidebar"
                            "control sidebar"
                            `,
          gridTemplateColumns: '1fr 600px',
          gridTemplateRows: '1fr 60px',
          width: '100%',
          height: '100%',
        }}
      >
        <PlayerPart />
        <ControlPart />

        <div style={{ gridArea: 'sidebar', height: '100%', padding: '10px' }}>
          右侧合并的长面板 (123)
        </div>
      </div>
    </>
  )
}

function useInit()
{
  useEffect(() =>
  {
    video_player.player.value = YouTubePlayer('video_player', { playerVars: { autoplay: 0 } })
    video_player.player.value?.loadVideoById(video_player.video_info.value.video_id)

    const interval_id = setInterval(async () =>
    {
      video_player.current_time.value = await video_player.player.value?.getCurrentTime() ?? 0
    }, 100)

    return () =>
    {
      video_player.player.value?.destroy()
      video_player.player.value = null
      clearInterval(interval_id)
    }
  }, [])
}
