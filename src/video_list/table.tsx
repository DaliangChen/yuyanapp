import { video_list } from './value'

const delete_video = (index: number) =>
{
  video_list.data.value.videos.splice(index, 1)
  video_list.data.value = { ...video_list.data.value }
}

export function TablePart()
{
  return (
    <table>
      <thead>
        <tr>
          <th scope='col' style={{ width: '200px' }}>Video Id</th>
          <th scope='col' style={{ width: '70px' }}>Srt</th>
          <th scope='col'>Note</th>
          <th scope='col' style={{ width: '1px' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {video_list.data.value.videos.sort((a, b) => b.update_time - a.update_time).map((video, index) => (
          <tr key={index}>
            <td>{video.video_id}</td>
            <td>{video.srt ? '✓' : '✗'}</td>
            <td>{video.note}</td>
            <td>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href='#'>Play</a>
                <a
                  href='#'
                  onClick={() => video_list.add_data.value = { video_info: video, status: 'edit' }}
                >
                  Edit
                </a>
                <a href='#' onClick={() => delete_video(index)}>
                  Delete
                </a>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
