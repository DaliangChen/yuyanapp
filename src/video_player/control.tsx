import { video_player } from './value'

const on_toggle_play = () =>
{
  if (video_player.is_playing.value)
  {
    video_player.player.value?.pauseVideo()
  } else
  {
    video_player.player.value?.playVideo()
  }
}

export function ControlPart()
{
  const isPlaying = video_player.is_playing.value
  const isAutoSkip = video_player.auto_skip_familiar.value

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}
    >
      <button className='outline' onClick={on_toggle_play}>
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>

      <button
        className='outline'
        onClick={() => (video_player.auto_skip_familiar.value = !video_player.auto_skip_familiar.value)}
      >
        ⏭ Skip familiar: {isAutoSkip ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
