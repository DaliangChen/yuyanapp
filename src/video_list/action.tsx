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
  const jsonContent = JSON.stringify(video_list.data.value, null, 2)
  try {
    if ('showSaveFilePicker' in window) {
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
      await writable.write(jsonContent)
      await writable.close()
      return
    }
  } catch (err: unknown) {
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
  try {
    if ('showOpenFilePicker' in window) {
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
      const parsed = JSON.parse(text)
      video_list.data.value = {
        videos: parsed.videos || [],
        word_stat: parsed.word_stat || {},
      }
      return
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') return
    console.warn('Native file open unavailable, falling back to file input:', err)
  }

  // Fallback file input
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.style.display = 'none'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = JSON.parse(text)
    video_list.data.value = {
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
  const totalWords = Object.keys(video_list.data.value.word_stat || {}).length

  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200'>
      <div>
        <div className='flex items-center gap-2.5'>
          <h1 className='text-xl font-semibold tracking-tight text-slate-800'>YuYan App</h1>
          <span className='px-2 py-0.5 text-xs text-slate-500 bg-slate-100 rounded-md font-mono'>语言精练</span>
        </div>
        <p className='text-xs text-slate-500 mt-0.5'>
          交互式双语字幕学习与逐句生词记忆
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={() => (app.show_page.value = 'vocabulary')}
          className='inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer'
        >
          <span>📖 生词本</span>
          <span className='px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]'>
            {totalWords}
          </span>
        </button>

        <button
          type='button'
          onClick={on_click_import_data}
          className='inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer'
        >
          导入 JSON
        </button>

        <button
          type='button'
          onClick={on_click_export_data}
          className='inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer'
        >
          备份数据
        </button>

        <button
          type='button'
          onClick={on_click_add_video}
          className='inline-flex items-center px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer'
        >
          + 添加视频
        </button>
      </div>
    </div>
  )
}
