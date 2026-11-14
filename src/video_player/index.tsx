import { useEffect } from 'preact/hooks'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { SrtPart } from './srt'
import * as video_player from './value'

export function VideoPlayerPage()
{
  useKeyboardShortcuts()

  return (
    <div id='video-player-page'>
      <div className='video-player-left'>
        <PlayerPart />
        <ControlPart />
      </div>

      <SrtPart />
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
