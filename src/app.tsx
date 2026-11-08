import appv from './appv'
import { FileListPage } from './page/file_list'
import { SelectFolderPage } from './page/select_folder'
import { VideoPlayerPage } from './page/vodio_player'

export function App()
{
  return (
    <>
      {appv.show_page.value === 'select_folder' && <SelectFolderPage />}
      {appv.show_page.value === 'file_list' && <FileListPage />}
      {appv.show_page.value === 'video_player' && <VideoPlayerPage />}
    </>
  )
}
