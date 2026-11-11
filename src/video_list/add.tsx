import type { ChangeEvent } from 'preact/compat'
import { app } from '../appv'
import { default_never, InfoError, LogicError } from '../util'
import * as video_list from './value'

export function AddPart()
{
  const isEditing = video_list.add_data.value?.status === 'edit'

  return (
    <dialog open={!!video_list.add_data.value}>
      <article>
        <header>
          <h3>{isEditing ? 'Edit Video' : 'Add Video'}</h3>
        </header>

        <form>
          <fieldset>
            <label>
              <p>Video ID</p>
              <input
                type='text'
                value={video_list.add_data.value?.video_info.video_id}
                onInput={on_change_video_id}
                disabled={isEditing}
              />
            </label>

            <label>
              <p>Note</p>
              <textarea
                rows={5}
                value={video_list.add_data.value?.video_info.note}
                onInput={on_change_note}
              />
            </label>
          </fieldset>
        </form>

        <footer>
          <button className='outline' onClick={on_click_cancel}>Cancel</button>
          <button className='outline' onClick={on_click_confirm}>Confirm</button>
        </footer>
      </article>
    </dialog>
  )
}

function on_change_video_id(e: ChangeEvent<HTMLInputElement>)
{
  const add_data = video_list.add_data.value
  if (!add_data) throw new LogicError()
  add_data.video_info.video_id = e.currentTarget.value
}

function on_change_note(e: ChangeEvent<HTMLTextAreaElement>)
{
  const add_data = video_list.add_data.value
  if (!add_data) throw new LogicError()
  add_data.video_info.note = e.currentTarget.value
}

function on_click_cancel()
{
  video_list.add_data.value = null
}

function on_click_confirm()
{
  const add_data = video_list.add_data.value
  if (!add_data) throw new LogicError()

  const add_video_id = add_data.video_info.video_id

  switch (add_data.status)
  {
    case 'add':
      const has_same_id = app.data.value.videos.some(video => video.video_id === add_video_id)
      if (has_same_id) throw new InfoError('Video ID already exists')
      app.data.value.videos.push({ ...add_data.video_info })
      break

    case 'edit':
      const video = app.data.value.videos.find(video => video.video_id === add_video_id)
      if (!video) throw new InfoError('Video not found')
      video.note = add_data.video_info.note
      video.update_time = Date.now()
      break

    default:
      default_never(add_data.status)
  }

  app.data.value = { ...app.data.value }
  video_list.add_data.value = null
}
