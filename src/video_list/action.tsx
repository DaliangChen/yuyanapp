import { app } from '../appv'
import { video_list } from './value'

const on_click_add_video = () =>
{
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
  const jsonContent = JSON.stringify(app.data.value, null, 2)
  try
  {
    if ('showSaveFilePicker' in window)
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

      const writable = await handle.createWritable()
      await writable.write(jsonContent)
      await writable.close()
      return
    }
  } catch (err: unknown)
  {
    if ((err as Error)?.name === 'AbortError') return
    console.warn('Native file save unavailable, falling back to download:', err)
  }

  // Fallback download blob
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'yuyan_data.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const on_click_import_data = async () =>
{
  try
  {
    if ('showOpenFilePicker' in window)
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
      const parsed = JSON.parse(text)
      app.data.value = {
        videos: parsed.videos || [],
        word_stat: parsed.word_stat || {},
      }
      return
    }
  } catch (err: unknown)
  {
    if ((err as Error)?.name === 'AbortError') return
    console.warn('Native file open unavailable, falling back to file input:', err)
  }

  // Fallback file input
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.style.display = 'none'
  input.onchange = async () =>
  {
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = JSON.parse(text)
    app.data.value = {
      videos: parsed.videos || [],
      word_stat: parsed.word_stat || {},
    }
    document.body.removeChild(input)
  }
  document.body.appendChild(input)
  input.click()
}

export function ActionPart()
{
  return (
    <div>
      <button
        type='button'
        onClick={on_click_import_data}
      >
        导入 JSON
      </button>

      <button
        type='button'
        onClick={on_click_export_data}
      >
        备份数据
      </button>

      <button
        type='button'
        onClick={on_click_add_video}
      >
        + 添加视频
      </button>
    </div>
  )
}
