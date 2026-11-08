import appv from '../appv'

export function SelectFolderPage()
{
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button onClick={on_click_select_folder}>
          Select Folder
        </button>
      </div>
    </>
  )
}

async function on_click_select_folder()
{
  try
  {
    let f = await window.showDirectoryPicker()

    for await (const [name, handle] of f.entries())
    {
      if (handle.kind === 'directory') continue
      if (!name.endsWith('.srt') && !name.endsWith('.mp4')) continue

      let file_base_name = name.replace(/\.[^/.]+$/, '')

      if (!appv.file_map.value[file_base_name])
      {
        appv.file_map.value[file_base_name] = { handle, has_srt: false, has_mp4: false }
      }

      if (name.endsWith('.srt'))
      {
        appv.file_map.value[file_base_name].has_srt = true
      }

      if (name.endsWith('.mp4'))
      {
        appv.file_map.value[file_base_name].has_mp4 = true
      }
    }
    appv.show_page.value = 'file_list'
  } catch (error)
  {
  }
}
