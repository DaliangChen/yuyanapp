import appv, { type FileInfo } from '../appv'

export function FileListPage()
{
  const table_body = Object.entries(appv.file_map.value).map(([name, file_info]) =>
  {
    return (
      <tr key={name}>
        <th scope='row'>{name}</th>
        <td>{file_info.has_srt ? '✓' : '✗'}</td>
        <td>{file_info.has_mp4 ? '✓' : '✗'}</td>
        <td>
          {file_info.has_mp4 && (
            <a href='#' onClick={() => on_click_open(file_info)}>
              Open
            </a>
          )}
        </td>
      </tr>
    )
  })

  return (
    <>
      <table>
        <thead>
          <tr>
            <th scope='col'>File Name</th>
            <th scope='col'>Srt</th>
            <th scope='col'>Mp4</th>
            <th scope='col'>Action</th>
          </tr>
        </thead>
        <tbody>{table_body}</tbody>
      </table>
    </>
  )
}  

async function on_click_open(file_info: FileInfo)
{
  appv.current_file_handle.value = file_info
  appv.show_page.value = 'video_player'
}
