import { video_list } from './video_listv'

function ActionPart()
{
  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'end' }}>
      <div style={{ width: '500px' }} role='group'>
        <button className='outline' onClick={video_list.on_click_create_data}>
          Create Data
        </button>
        <button className='outline' onClick={video_list.on_click_upload_data}>
          Upload Data
        </button>
        <button
          className='outline'
          disabled={!video_list.data_file_handle.value}
          onClick={video_list.on_click_add_video}
        >
          Add Video
        </button>
      </div>
    </div>
  )
}

function TablePart()
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
            <td>
              <button>
                Play
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function VideoListPage()
{
  return (
    <div style={{ height: '100%', padding: '10px' }}>
      <ActionPart />
      <TablePart />
    </div>
  )
}
