import * as app from '../appv'
import type { VideoInfo } from '../util'
import * as video_list from './value'

export function ActionPart()
{
  return (
    <div style={{ display: 'flex', justifyContent: 'end' }}>
      <div role='group' style={{ width: 'fit-content' }}>
        <button className='outline' onClick={on_click_import}>Import</button>
        <button className='outline' onClick={on_click_export}>Export</button>
        <button className='outline' onClick={on_click_add}>Add</button>
        <button className='outline' onClick={on_click_paste_video_list}>Paste Video List</button>
      </div>
    </div>
  )
}

async function on_click_paste_video_list()
{
  const raw_paste = await navigator.clipboard.readText()
  const row_list = raw_paste
    .split('\n')
    .map(row => row.trim().split('|').map(col => col.trim()))
    .filter(row => row.length === 2)
    .filter(([video_id, note]) => !!video_id && !!note)
    .map<VideoInfo>(([video_id, note]) =>
    {
      return {
        video_id,
        srt: '',
        note,
        update_time: Date.now(),
        sentense_list: [],
      }
    })

  const push_list = row_list.filter(video_info => !app.data.value.videos.some(v => v.video_id === video_info.video_id))
  app.data.value = {
    videos: [...app.data.value.videos, ...push_list],
    word_stat: app.data.value.word_stat,
  }
}

function on_click_add()
{
  video_list.add_data.value = {
    video_info: {
      video_id: '',
      srt: '',
      note: '',
      update_time: Date.now(),
      sentense_list: [],
    },
    status: 'add',
  }
}

async function on_click_export()
{
  const json_content = JSON.stringify(app.data.value, null, 2)

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

  const writable = await handle.createWritable()
  await writable.write(json_content)
  await writable.close()
}

async function on_click_import()
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

  const file = await handle.getFile()
  const text = await file.text()
  const parsed_json = JSON.parse(text)

  app.data.value = {
    videos: parsed_json.videos || [],
    word_stat: parsed_json.word_stat || {},
  }
}
