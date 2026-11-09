import type { ChangeEvent } from 'preact/compat'
import { default_never, InfoError } from '../appv'
import { video_list } from './value'

function extractYouTubeId(urlOrId: string): string
{
  const trimmed = urlOrId.trim()
  const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const match = trimmed.match(reg)
  return match ? match[1] : trimmed
}

const on_change_video_id = (e: ChangeEvent<HTMLInputElement>) =>
{
  if (!video_list.add_data.value) return
  const raw = e.currentTarget.value
  video_list.add_data.value.video_info.video_id = raw
}

const on_blur_video_id = (e: ChangeEvent<HTMLInputElement>) =>
{
  if (!video_list.add_data.value) return
  const cleanId = extractYouTubeId(e.currentTarget.value)
  video_list.add_data.value.video_info.video_id = cleanId
  e.currentTarget.value = cleanId
}

const on_change_note = (e: ChangeEvent<HTMLTextAreaElement>) =>
{
  if (!video_list.add_data.value) return
  video_list.add_data.value.video_info.note = e.currentTarget.value
}

const on_click_cancel = () => video_list.add_data.value = null

const on_click_confirm = () =>
{
  const add_value = video_list.add_data.value
  if (!add_value) return

  const cleanId = extractYouTubeId(add_value.video_info.video_id)
  if (!cleanId) throw new InfoError('Video Id or YouTube URL is required')
  add_value.video_info.video_id = cleanId

  switch (add_value.status)
  {
    case 'add':
      const has_same_id = video_list.data.value.videos.some(video => video.video_id === cleanId)
      if (has_same_id) throw new InfoError('Video Id already exists')
      video_list.data.value.videos.push({ ...add_value.video_info })
      break

    case 'edit':
      const video = video_list.data.value.videos.find(video => video.video_id === cleanId)
      if (!video) throw new InfoError('Video Id not found')
      video.note = add_value.video_info.note
      video.update_time = Date.now()
      break

    default:
      default_never(add_value.status)
  }

  video_list.data.value = { ...video_list.data.value }
  video_list.add_data.value = null
}

export function AddPart()
{
  const isEditing = video_list.add_data.value?.status === 'edit'
  return (
    <dialog open={video_list.add_data.value !== null}>
      <article>
        <h4>{isEditing ? 'Edit Video' : 'Add YouTube Video'}</h4>
        <form onSubmit={(e) => { e.preventDefault(); on_click_confirm(); }}>
          <fieldset>
            <label>
              YouTube Video ID or URL
              <input
                placeholder='e.g. M7lc1UVf-VE or https://www.youtube.com/watch?v=...'
                value={video_list.add_data.value?.video_info.video_id}
                onInput={on_change_video_id}
                onBlur={on_blur_video_id}
                disabled={isEditing}
              />
            </label>
            <label>
              Note / Title
              <textarea
                placeholder='Add notes or description for this video...'
                value={video_list.add_data.value?.video_info.note}
                onInput={on_change_note}
              />
            </label>
          </fieldset>
        </form>
        <footer>
          <button className='outline' type='button' onClick={on_click_cancel}>
            Cancel
          </button>
          <button className='outline' type='button' onClick={on_click_confirm}>
            Confirm
          </button>
        </footer>
      </article>
    </dialog>
  )
}
