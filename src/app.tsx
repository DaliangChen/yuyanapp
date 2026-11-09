import appv from './appv'
import { VideoListPage } from './page/video_list'
import { VideoPlayerPage } from './page/vodio_player'

export function App()
{
  return (
    <>
      {appv.app.show_page.value === 'video_list' && <VideoListPage />}
      {appv.app.show_page.value === 'video_player' && <VideoPlayerPage />}
    </>
  )
}
