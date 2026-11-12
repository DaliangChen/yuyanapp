import * as video_player from './value'

export function ControlPart()
{
  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
      <button className='outline' style={{ width: 'auto' }} onClick={on_toggle_play}>
        {video_player.is_playing.value ? '⏸ Pause' : '▶ Play'}
      </button>
      <button className='outline' style={{ width: 'auto' }} onClick={on_toggle_skip_familiar}>
        ⏭ Skip familiar: {video_player.is_skip_familiar.value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

function on_toggle_skip_familiar()
{
  video_player.is_skip_familiar.value = !video_player.is_skip_familiar.value
}

function on_toggle_play()
{
  video_player.is_playing.value = !video_player.is_playing.value
}
