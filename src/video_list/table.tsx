import { computed } from '@preact/signals'
import * as app from '../appv'
import * as srt_edit from '../srt_editer/value'
import * as util from '../util'
import { type VideoInfo } from '../util'
import * as video_player from '../video_player/value'
import * as video_list from './value'

const table_data = computed(() =>
{
  const sorted_videos = [...app.data.value.videos].sort((a, b) =>
  {
    if (a.pass) return 1
    if (b.pass) return -1
    return b.update_time - a.update_time
  })
  const current_page = video_list.current_page.value
  const start_index = (current_page - 1) * video_list.page_size.value
  const end_index = Math.min(start_index + video_list.page_size.value, sorted_videos.length)
  const paginated_videos = sorted_videos.slice(start_index, end_index)

  return paginated_videos
})

export function TablePart()
{
  const word_stat = app.data.value.word_stat

  return (
    <div className='table-scroll'>
      <table>
        <thead>
          <tr>
            <th scope='col' className='video-id-col'>Video Id</th>
            <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Srt</th>
            <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Pass</th>
            <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>New Words</th>
            {!util.is_mobile
              && (
                <>
                  <th scope='col'>Note</th>
                  <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Action</th>
                </>
              )}
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
                <input
                  type='checkbox'
                  checked={!!video.pass}
                  onChange={(e) => on_click_pass(video, !!e.currentTarget.checked)}
                />
              </td>
              <td>
                {video.srt ? count_unfamiliar_words(video, word_stat) : '-'}
              </td>
              {!util.is_mobile
                && (
                  <>
                    <td>
                      {video.note}
                    </td>
                    <td>
                      <span style={{ display: 'flex', gap: '10px' }}>
                        <a href='#' onClick={() => on_click_delete(video.video_id)}>Delete</a>
                      </span>
                    </td>
                  </>
                )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function on_click_pass(video: VideoInfo, pass: boolean)
{
  video.pass = pass ? 1 : undefined
  video.update_time = Date.now()
  app.data.value = { ...app.data.value }
}

function count_unfamiliar_words(video: VideoInfo, word_stat: Record<string, boolean>): number
{
  const unfamiliar_words_array = video.sentense_list.flatMap(sentense => sentense.words).filter(word =>
    !word_stat[word]
  )
  return new Set(unfamiliar_words_array).size
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

async function on_click_load(video: VideoInfo)
{
  const [handle] = await window.showOpenFilePicker(
    {
      multiple: false,
      types: [
        {
          description: 'SRT',
          accept: {
            'text/srt': ['.srt'],
          },
        },
      ],
    },
  )
  await video_list.add_srt_by_handle(handle, video)
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
