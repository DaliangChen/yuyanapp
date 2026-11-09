import type { ChangeEvent } from 'preact/compat'
import { InfoError } from '../appv'
import { video_list } from './value'

const on_change_video_id = (e: ChangeEvent<HTMLInputElement>) =>
{
  if (!video_list.add_data.value) return
  video_list.add_data.value.video_id = e.currentTarget.value
}

const on_change_note = (e: ChangeEvent<HTMLTextAreaElement>) =>
{
  if (!video_list.add_data.value) return
  video_list.add_data.value.note = e.currentTarget.value
}

const on_click_cancel = () => video_list.add_data.value = null

const on_click_confirm = () =>
{
  const add_value = video_list.add_data.value

  if (!add_value || !add_value.video_id) throw new InfoError('Video Id is required')

  const data = video_list.data.value.videos.find(video => video.video_id === add_value.video_id)
  if (data) data.note = add_value.note
  else video_list.data.value.videos.push(add_value)

  video_list.data.value = { ...video_list.data.value }
  video_list.add_data.value = null
}

export function AddPart()
{
  return (
    <dialog open={video_list.add_data.value !== null}>
      <article>
        <h4>Add Video</h4>
        <form>
          <fieldset>
            <label>
              Video Id
              <input value={video_list.add_data.value?.video_id} onInput={on_change_video_id} />
            </label>
            <label>
              Note
              <textarea value={video_list.add_data.value?.note} onInput={on_change_note} />
            </label>
          </fieldset>
        </form>
        <footer>
          <button className='outline' onClick={on_click_cancel}>
            Cancel
          </button>
          <button className='outline' onClick={on_click_confirm}>
            Confirm
          </button>
        </footer>
      </article>
    </dialog>
  )
}
