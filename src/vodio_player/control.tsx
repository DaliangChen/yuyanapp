import { app } from '../appv'
import { video_player } from './value'

const on_click_play = () =>
{
  video_player.player.value?.playVideo()
}

const on_click_pause = () =>
{
  video_player.player.value?.pauseVideo()
}

export function ControlPart()
{
  return (
    <div
      style={{
        gridArea: 'control',
        display: 'flex',
        gap: '10px',
        padding: '10px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button className='outline' onClick={on_click_play}>
        Play
      </button>

      <button className='outline' onClick={on_click_pause}>
        Pause
      </button>
      <button className='outline' onClick={on_click_go_to_list}>
        Go To List
      </button>
    </div>
  )
}

function on_click_go_to_list()
{
  app.show_page.value = 'video_list'
}
