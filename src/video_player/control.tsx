import { app } from '../appv'
import { video_player, type SubtitleMode } from './value'

const on_toggle_play = () =>
{
  if (video_player.is_playing.value) {
    video_player.player.value?.pauseVideo()
  } else {
    video_player.player.value?.playVideo()
  }
}

const on_seek_relative = async (seconds: number) =>
{
  const current = (await video_player.player.value?.getCurrentTime()) ?? video_player.current_time.value
  video_player.player.value?.seekTo(Math.max(0, current + seconds), true)
}

const on_change_rate = (rate: number) =>
{
  video_player.playback_rate.value = rate
  video_player.player.value?.setPlaybackRate(rate)
}

const on_toggle_loop = () =>
{
  video_player.loop_current_sentence.value = !video_player.loop_current_sentence.value
}

export function ControlPart()
{
  const isPlaying = video_player.is_playing.value
  const isLooping = video_player.loop_current_sentence.value
  const currentRate = video_player.playback_rate.value
  const subMode = video_player.subtitle_mode.value

  return (
    <div
      style={{
        gridArea: 'control',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px 12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className='outline'
          style={{ minWidth: '90px' }}
          onClick={on_toggle_play}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          className='outline secondary'
          title='Rewind 5s (← key)'
          onClick={() => on_seek_relative(-5)}
        >
          ⏪ -5s
        </button>

        <button
          className='outline secondary'
          title='Forward 5s (→ key)'
          onClick={() => on_seek_relative(5)}
        >
          ⏩ +5s
        </button>

        <button
          className={isLooping ? '' : 'outline'}
          style={isLooping ? { backgroundColor: '#3399ff', color: '#fff', borderColor: '#3399ff' } : {}}
          title='Loop current subtitle sentence'
          onClick={on_toggle_loop}
        >
          🔁 {isLooping ? 'Looping Sentence' : 'Loop Sentence'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>Speed:</span>
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              className={currentRate === rate ? '' : 'outline secondary'}
              style={{ padding: '2px 8px', fontSize: '12px', margin: 0 }}
              onClick={() => on_change_rate(rate)}
            >
              {rate}x
            </button>
          ))}
        </div>

        <select
          value={subMode}
          onChange={(e) => {
            video_player.subtitle_mode.value = (e.currentTarget.value as SubtitleMode)
          }}
          style={{ width: 'auto', margin: 0, padding: '4px 8px', fontSize: '13px' }}
        >
          <option value='bilingual'>Bilingual (双语)</option>
          <option value='srt_1'>Primary Only (主字幕)</option>
          <option value='srt_2'>Secondary Only (译文)</option>
        </select>

        <button
          className='outline secondary'
          style={{ margin: 0, whiteSpace: 'nowrap' }}
          onClick={on_click_go_to_list}
        >
          ← Back to List
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
