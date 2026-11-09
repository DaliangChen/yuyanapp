import { LogicError } from '../appv'
import { video_list } from './value'

const on_click_add_video = () =>
{
  if (!video_list.data_file_handle.value) throw new LogicError()

  video_list.add_data.value = {
    video_info: {
      video_id: '',
      srt_1: '',
      srt_2: '',
      note: '',
      update_time: Date.now(),
    },
    status: 'add',
  }
}

const on_click_export_data = async () =>
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

const on_click_import_data = async () =>
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

export function ActionPart()
{
  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'end' }}>
      <div style={{ width: '500px' }} role='group'>
        <button className='outline' onClick={on_click_export_data}>
          Export Data
        </button>
        <button className='outline' onClick={on_click_import_data}>
          Import Data
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
