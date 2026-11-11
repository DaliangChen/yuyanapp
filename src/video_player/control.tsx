import { skip_if_current_familiar } from './srt'
import * as video_player from './value'

export function ControlPart()
{
  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
      <button className='outline' style={{ width: 'auto' }} onClick={on_toggle_play}>
        {video_player.is_playing.value ? '⏸ Pause' : '▶ Play'}
      </button>
      <button className='outline' style={{ width: 'auto' }} onClick={on_toggle_skip_familiar}>
        ⏭ Skip familiar: {video_player.auto_skip_familiar.value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

function on_toggle_skip_familiar()
{
  video_player.auto_skip_familiar.value = !video_player.auto_skip_familiar.value
  if (video_player.auto_skip_familiar.value)
  {
    skip_if_current_familiar()
  }
}

function on_toggle_play()
{
  if (video_player.is_playing.value) video_player.player.value?.pauseVideo()
  else video_player.player.value?.playVideo()
}
