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
          <th scope='col'>Video Id</th>
          <th scope='col'>Srt</th>
          <th scope='col'>Note</th>
          <th scope='col'>Action</th>
        </tr>
      </thead>
      <tbody>
        {video_list.data.value.videos.map((video, index) => (
          <tr key={index}>
            <td>{video.video_id}</td>
            <td>{video.srt}</td>
            <td>{video.note}</td>
            <td style={{ width: '1px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href='#'>Play</a>
                <a href='#' onClick={() => video_list.add_data.value = video}>
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
