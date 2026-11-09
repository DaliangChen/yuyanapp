import appv from '../appv'

export function VideoListPage()
{
  return (
    <div style={{ height: '100%', padding: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'end' }}>
        <div style={{ width: '500px' }} role='group'>
          <button className='outline' onClick={appv.video_list.on_click_create_data}>
            Create Data
          </button>
          <button className='outline' onClick={appv.video_list.on_click_upload_data}>
            Upload Data
          </button>
          <button className='outline' onClick={appv.video_list.on_click_add_video}>
            Add Video
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th scope='col'>File Name</th>
            <th scope='col'>Srt</th>
            <th scope='col'>Mp4</th>
            <th scope='col'>Action</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  )
}
