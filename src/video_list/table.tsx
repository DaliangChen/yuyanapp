import { app, LogicError, type VideoInfo } from '../appv'
import { video_player } from '../vodio_player/value'
import { video_list } from './value'

export function TablePart()
{
  return (
    <table>
      <thead>
        <tr>
          <th scope='col' style={{ width: '200px' }}>Video Id</th>
          <th scope='col' style={{ width: '100px' }}>Srt</th>
          <th scope='col'>Note</th>
          <th scope='col' style={{ width: '1px' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {video_list.data.value.videos.sort((a, b) => b.update_time - a.update_time).map((video, index) => (
          <tr key={index}>
            <td>
              <a
                href='#'
                onClick={() =>
                  on_click_play(video)}
              >
                Play
              </a>
              &nbsp;&nbsp;
              {video.video_id}
            </td>
            <td>
              {video.srt ? '✓' : (
                <a onClick={() => on_click_load(video.video_id)}>
                  Load
                </a>
              )}
            </td>
            <td>{video.note}</td>
            <td>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href='#' onClick={() => on_click_edit(video)}>
                  Edit
                </a>
                <a href='#' onClick={() => on_click_delete(index)}>
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

function on_click_edit(video: VideoInfo)
{
  video_list.add_data.value = { video_info: video, status: 'edit' }
}

async function on_click_load(video_id: string)
{
  let [handle] = await window.showOpenFilePicker(
    {
      multiple: false,
      types: [
        {
          description: 'VTT',
          accept: {
            'text/vtt': ['.vtt'],
          },
        },
      ],
    },
  )

  const file = await handle.getFile()
  const srt_text = await file.text()

  const video = video_list.data.value.videos.find(v => v.video_id === video_id)
  if (!video) throw new LogicError()

  video.srt = srt_text
  video.update_time = Date.now()
  video_list.data.value = { ...video_list.data.value }
}

function on_click_delete(index: number)
{
  video_list.data.value.videos.splice(index, 1)
  video_list.data.value = { ...video_list.data.value }
}

function on_click_play(video: VideoInfo)
{
  video_player.video_info.value = video
  app.show_page.value = 'video_player'
}
