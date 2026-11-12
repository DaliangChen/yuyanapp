import { useEffect } from 'preact/hooks'
import * as app from '../appv'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { SrtPart } from './srt'
import * as video_player from './value'

export function VideoPlayerPage()
{
  useKeyboardShortcuts()

  if (!video_player.video_info.value)
  {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3>No Video Selected</h3>
        <p style={{ color: 'var(--pico-muted-color)' }}>
          Please choose a video from the Video List to start watching and learning with subtitles.
        </p>
        <button
          className='outline'
          style={{ width: 'auto' }}
          onClick={() => (app.show_page.value = 'video_list')}
        >
          Go to Video List
        </button>
      </div>
    )
  }

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

function useKeyboardShortcuts()
{
  useEffect(() =>
  {
    const handleKeyDown = (e: KeyboardEvent) =>
    {
      if (e.code === 'Space')
      {
        e.preventDefault()
        video_player.is_playing.value = !video_player.is_playing.value
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
