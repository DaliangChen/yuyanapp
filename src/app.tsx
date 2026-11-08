import appv from './appv'
import { SelectFolderPage } from './page/select_folder'
import { FileList } from './page/file_list'

export function App()
{
  return (
    <>
      {appv.show_page_index.value === 'select_folder' && <SelectFolderPage />}
      {appv.show_page_index.value === 'file_list' && <FileList />}
    </>
  )
}
