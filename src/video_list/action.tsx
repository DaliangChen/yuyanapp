import * as app from '../appv'
import { save_data } from '../appv'
import { is_mobile, type VideoInfo } from '../util'
import * as video_list from '../video_list/value'

export function ActionPart()
{
  return (
    <div className='video-list-actions'>
      <div role='group' className='video-list-action-group'>
        <button className='outline' onClick={on_click_import}>Import</button>
        <button className='outline' onClick={on_click_export}>Export</button>
        {!is_mobile
          && (
            <>
              <button className='outline' onClick={on_click_paste_video_list}>Paste Video List</button>
              <button className='outline' onClick={on_click_add_srt}>Add Srt</button>
            </>
          )}
        <button className='outline' onClick={save_data}>Save Data</button>
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

async function on_click_add_srt()
{
  // 选取文件夹
  const dir_handle = await window.showDirectoryPicker()

  // 读取文件夹下的所有 srt 文件
  const entries = await Array.fromAsync(dir_handle.entries())
  const srt_file_list = entries.filter(([name]) => name.endsWith('.srt'))

  // 根据文件名匹配视频文件
  for (const [name, handle] of srt_file_list)
  {
    if (handle.kind === 'directory') continue

    const video_name = name.replace('.srt', '')
    const video = app.data.value.videos.find(v => v.video_id === video_name)
    if (video) await video_list.add_srt_by_handle(handle, video)
  }
}

async function on_click_export()
{
  const json_content = JSON.stringify(app.data.value)

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
