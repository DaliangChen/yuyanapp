import { app, LogicError, type VideoInfo } from '../appv'
import { video_player } from '../video_player/value'
import { video_list } from './value'

export function TablePart()
{
  const sortedVideos = [...video_list.data.value.videos].sort((a, b) => b.update_time - a.update_time)

  if (sortedVideos.length === 0)
  {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <p>No videos found. Click <strong>"Add Video"</strong> above to add one, or import your saved JSON data.</p>
      </div>
    )
  }

  return (
    <table>
      <thead>
        <tr>
          <th scope='col' style={{ width: '220px' }}>Video Id</th>
          <th scope='col' style={{ width: '100px' }}>Srt 1</th>
          <th scope='col' style={{ width: '100px' }}>Srt 2</th>
          <th scope='col'>Note</th>
          <th scope='col' style={{ width: '120px' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {sortedVideos.map((video) => (
          <tr key={video.video_id}>
            <td>
              <a
                href='#'
                onClick={(e) => {
                  e.preventDefault()
                  on_click_play(video)
                }}
              >
                ▶ Play
              </a>
              &nbsp;&nbsp;
              <code>{video.video_id}</code>
            </td>
            <td>
              {video.srt_1 ? '✓ Loaded' : (
                <a href='#' onClick={(e) => { e.preventDefault(); on_click_load(video.video_id, 'srt_1'); }}>
                  Load
                </a>
              )}
            </td>
            <td>
              {video.srt_2 ? '✓ Loaded' : (
                <a href='#' onClick={(e) => { e.preventDefault(); on_click_load(video.video_id, 'srt_2'); }}>
                  Load
                </a>
              )}
            </td>
            <td>{video.note || <em style={{ color: '#999' }}>No note</em>}</td>
            <td>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href='#' onClick={(e) => { e.preventDefault(); on_click_edit(video); }}>
                  Edit
                </a>
                <a
                  href='#'
                  style={{ color: '#d32f2f' }}
                  onClick={(e) => {
                    e.preventDefault();
                    on_click_delete(video.video_id);
                  }}
                >
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

async function on_click_load(video_id: string, srt_type: 'srt_1' | 'srt_2')
{
  let srt_text = ''
  try {
    if ('showOpenFilePicker' in window) {
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
      srt_text = await file.text()
    } else {
      throw new Error('Native file picker not supported')
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') return
    // Fallback file input
    srt_text = await new Promise<string>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.vtt,.srt,text/vtt,text/plain'
      input.style.display = 'none'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (file) {
          resolve(await file.text())
        } else {
          resolve('')
        }
        document.body.removeChild(input)
      }
      document.body.appendChild(input)
      input.click()
    })
  }

  if (!srt_text) return

  const video = video_list.data.value.videos.find(v => v.video_id === video_id)
  if (!video) throw new LogicError()

  if (srt_type === 'srt_1') video.srt_1 = srt_text
  else video.srt_2 = srt_text
  video.update_time = Date.now()
  video_list.data.value = { ...video_list.data.value }
}

function on_click_delete(videoId: string)
{
  video_list.data.value.videos = video_list.data.value.videos.filter(v => v.video_id !== videoId)
  video_list.data.value = { ...video_list.data.value }
}

function on_click_play(video: VideoInfo)
{
  video_player.video_info.value = video
  app.show_page.value = 'video_player'
}
