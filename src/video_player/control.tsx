import { app } from '../appv'
import { video_player } from './value'

const on_toggle_play = () =>
{
  if (video_player.is_playing.value) {
    video_player.player.value?.pauseVideo()
  } else {
    video_player.player.value?.playVideo()
  }
}

export function ControlPart()
{
  const isPlaying = video_player.is_playing.value
  const videoNote = video_player.video_info.value?.note || video_player.video_info.value?.video_id || ''

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          className='outline'
          style={{
            minWidth: '95px',
            margin: 0,
            borderColor: '#38bdf8',
            color: '#38bdf8',
            padding: '6px 14px',
          }}
          onClick={on_toggle_play}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>

        <span
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            maxWidth: '450px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={videoNote}
        >
          {videoNote}
        </span>
      </div>

      <div>
        <button
          className='outline secondary'
          style={{ margin: 0, padding: '6px 14px', color: '#cbd5e1', borderColor: '#475569' }}
          onClick={on_click_go_to_list}
        >
          ← 返回视频列表
        </button>
      </div>
    </div>
  )
}

function on_click_go_to_list()
{
  video_player.player.value?.pauseVideo()
  app.show_page.value = 'video_list'
}
