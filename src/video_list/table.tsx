import { computed } from '@preact/signals'
import SrtParser from 'srt-parser-2'
import * as app from '../appv'
import * as srt_edit from '../srt_editer/value'
import { type VideoInfo } from '../util'
import * as video_player from '../video_player/value'
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
          <th scope='col' style={{ width: '200px' }}>Video Id</th>
          <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Srt</th>
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
              {video.srt
                ? (
                  <span style={{ display: 'flex', gap: '10px' }}>
                    <a href='#' onClick={() => on_click_srt_edit(video)}>Edit</a>
                    <a href='#' onClick={() => on_click_srt_delete(video)}>Delete</a>
                  </span>
                )
                : (
                  <a href='#' onClick={() => on_click_load(video)}>
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

function on_click_srt_edit(video: VideoInfo)
{
  srt_edit.edit_data.value = video
  app.show_page.value = 'srt_editer'
}

function on_click_srt_delete(video: VideoInfo)
{
  video.srt = ''
  video.sentense_list = []
  app.data.value = { ...app.data.value }
}

function on_click_edit(video: VideoInfo)
{
  video_list.add_data.value = { video_info: video, status: 'edit' }
}

async function on_click_load(video: VideoInfo)
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

  let parser = new SrtParser()
  let srt_array = parser.fromSrt(srt_text)
  const segmenter = new Intl.Segmenter('de-DE', { granularity: 'word' })

  video.sentense_list = srt_array.map(it =>
  {
    const segments = Array.from(segmenter.segment(it.text))
    const words = segments
      .filter(item => item.isWordLike)
      .map(item => item.segment)

    words.forEach(word =>
    {
      if (!(word in app.data.value.word_stat))
      {
        app.data.value.word_stat[word] = false
      }
    })

    return {
      start_time_str: it.startTime,
      end_time_str: it.endTime,
      start_time: it.startSeconds,
      end_time: it.endSeconds,
      text: it.text,
      index: it.id,
      words: words,
    }
  })

  video.srt = srt_text
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
