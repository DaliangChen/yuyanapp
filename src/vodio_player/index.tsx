import { useEffect } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import { video_player } from './value'

function on_time()
{
  app.show_page.value = 'video_list'
}

function useInit()
{
  useEffect(() =>
  {
    video_player.player.value = YouTubePlayer('video_player', { playerVars: { autoplay: 0 } })
    video_player.player.value?.loadVideoById(video_player.video_info.value.video_id)
    video_player.player.value.addEventListener('', on_time)

    return () =>
    {
      video_player.player.value?.removeEventListener('onStateChange', on_time)
      video_player.player.value?.destroy()
      video_player.player.value = null
    }
  }, [])
}

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
        <div
          style={{
            gridArea: 'video',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
          }}
        >
          <div id='video_player' style={{ width: '100%', borderRadius: '10px' }} />
        </div>

        <div style={{ gridArea: 'control' }}>
          控制区域
        </div>

        <div style={{ gridArea: 'sidebar', height: '100%' }}>
          右侧合并的长面板 (123)
        </div>
      </div>
    </>
  )
}
