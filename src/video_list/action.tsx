import * as app from '../appv'
import * as video_list from './value'

export function ActionPart()
{
  return (
    <div style={{ display: 'flex', justifyContent: 'end' }}>
      <div role='group' style={{ width: 'fit-content' }}>
        <button className='outline' onClick={on_click_import}>Import</button>
        <button className='outline' onClick={on_click_export}>Export</button>
        <button className='outline' onClick={on_click_add}>Add</button>
      </div>
    </div>
  )
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
