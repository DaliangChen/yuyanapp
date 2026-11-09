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
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div>
        <h3 style={{ margin: 0 }}>YuYan App (语言)</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
          Language Learning with Interactive Subtitles & YouTube
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className='outline secondary'
          onClick={() => app.show_page.value = 'vocabulary'}
        >
          📖 Vocabulary ({totalWords})
        </button>
        <button className='outline' onClick={on_click_export_data}>
          Export Data
        </button>
        <button className='outline' onClick={on_click_import_data}>
          Import Data
        </button>
        <button
          className='outline'
          onClick={on_click_add_video}
        >
          + Add Video
        </button>
      </div>
    </div>
  )
}
