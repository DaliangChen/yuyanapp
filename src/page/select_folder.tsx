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
          选择文件夹
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
      if (handle.kind === 'file')
      {
        appv.file_map.value[name] = handle
      }
    }
    appv.show_page_index.value = 'file_list'
  } catch (error)
  {
  }
}
