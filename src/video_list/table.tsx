import { computed } from '@preact/signals'
import { app } from '../appv'
import { type VideoInfo } from '../util'
import { video_player } from '../video_player/value'
import * as video_list from './value'

const table_data = computed(() =>
{
  const sorted_videos = [...app.data.value.videos].sort((a, b) => b.update_time - a.update_time)
  const page_size = 15
  const current_page = video_list.current_page.value
  const start_index = (current_page - 1) * page_size
  const end_index = Math.min(start_index + page_size, sorted_videos.length)
  const paginated_videos = sorted_videos.slice(start_index, end_index)

  return paginated_videos
})

export function TablePart()
{
  return (
    <table>
      <thead>
        <tr>
          <th scope='col' style={{ width: '200px'}}>Video Id</th>
          <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Srt 1</th>
          <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Srt 2</th>
          <th scope='col'>Note</th>
          <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {table_data.value.map((video) => (
          <tr key={video.video_id}>
            <td scope='row'>
              <a onClick={() => on_click_play(video)} href='#'>▶&nbsp;&nbsp;{video.video_id}</a>
            </td>
            <td>
              {video.srt_1 ? <span>Loaded</span> : (
                <a href='#' onClick={() => on_click_load(video, 'srt_1')}>
                  Load
                </a>
              )}
            </td>
            <td>
              {video.srt_2 ? <span>Loaded</span> : (
                <a href='#' onClick={() => on_click_load(video, 'srt_2')}>
                  Load
                </a>
              )}
            </td>
            <td>
              {video.note}
            </td>
            <td>
              <span style={{ display: 'flex', gap: '10px' }}>
                <a href='#' onClick={() => on_click_edit(video)}>Edit</a>
                <a href='#' onClick={() => on_click_delete(video.video_id)}>Delete</a>
              </span>
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

async function on_click_load(video: VideoInfo, srt_type: 'srt_1' | 'srt_2')
{
  const [handle] = await window.showOpenFilePicker(
    {
      multiple: false,
      types: [
        {
          description: 'VTT / SRT',
          accept: {
            'text/vtt': ['.vtt'],
            'text/srt': ['.srt'],
          },
        },
      ],
    },
  )
  const file = await handle.getFile()
  const srt_text = await file.text()
  if (!srt_text) return

  if (srt_type === 'srt_1') video.srt_1 = srt_text
  else video.srt_2 = srt_text
  video.update_time = Date.now()
  app.data.value = { ...app.data.value }
}

function on_click_delete(video_id: string)
{
  app.data.value.videos = app.data.value.videos.filter(v => v.video_id !== video_id)
  app.data.value = { ...app.data.value }
}

function on_click_play(video: VideoInfo)
{
  video_player.video_info.value = video
  app.show_page.value = 'video_player'
}
