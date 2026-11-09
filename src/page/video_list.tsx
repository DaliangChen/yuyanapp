import type { ChangeEvent } from 'preact/compat'
import { LogicError } from '../appv'
import { video_list } from './video_listv'

function AddPart()
{
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
  const on_click_confirm = () => video_list.add_data.value = null

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

function ActionPart()
{
  const on_click_add_video = () =>
  {
    if (!video_list.data_file_handle.value) throw new LogicError()

    video_list.add_data.value = {
      video_id: '',
      srt: '',
      note: '',
    }
  }

  const on_click_create_data = async () =>
  {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'yuyan_data.json',
      types: [
        {
          description: 'Json',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    })

    video_list.data_file_handle.value = handle

    const writable = await handle.createWritable()
    await writable.write(JSON.stringify(video_list.data.value, null, 2))
    await writable.close()
  }

  const on_click_upload_data = async () =>
  {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Json',
        accept: {
          'application/json': ['.json'],
        },
      }],
      multiple: false,
    })

    video_list.data_file_handle.value = handle

    const file = await handle.getFile()
    const text = await file.text()
    video_list.data.value = JSON.parse(text)

    if (!video_list.data.value.videos) video_list.data.value.videos = []
    if (!video_list.data.value.word_stat) video_list.data.value.word_stat = {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'end' }}>
      <div style={{ width: '500px' }} role='group'>
        <button className='outline' onClick={on_click_create_data}>
          Create Data
        </button>
        <button className='outline' onClick={on_click_upload_data}>
          Upload Data
        </button>
        <button
          className='outline'
          disabled={!video_list.data_file_handle.value}
          onClick={on_click_add_video}
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
      <AddPart />
    </div>
  )
}
