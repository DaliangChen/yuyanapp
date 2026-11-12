import { useEffect } from 'preact/hooks'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { SrtPart } from './srt'
import * as video_player from './value'

export function VideoPlayerPage()
{
  useKeyboardShortcuts()

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
