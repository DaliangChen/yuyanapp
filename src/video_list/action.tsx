import { useState } from 'preact/hooks'
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
  const [showVocab, setShowVocab] = useState(false)
  const words = Object.entries(video_list.data.value.word_stat || {})
    .sort(([, a], [, b]) => b.fail - a.fail)

  const pronounce = (word: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word)
      u.lang = 'en-US'
      window.speechSynthesis.speak(u)
    }
  }

  const deleteWord = (word: string) => {
    delete video_list.data.value.word_stat[word]
    video_list.data.value = { ...video_list.data.value }
  }

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
          onClick={() => setShowVocab(true)}
        >
          📖 Vocabulary ({words.length})
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

      {showVocab && (
        <dialog open>
          <article style={{ maxWidth: '600px', width: '90vw' }}>
            <header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>📖 My Vocabulary Book ({words.length})</h4>
                <button
                  className='outline secondary'
                  style={{ margin: 0, padding: '2px 8px' }}
                  onClick={() => setShowVocab(false)}
                >
                  ✕
                </button>
              </div>
            </header>

            {words.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>
                No vocabulary words saved yet. Click any word in the subtitle during video playback to mark as known or review!
              </p>
            ) : (
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr>
                      <th>Word</th>
                      <th>Known</th>
                      <th>Need Review</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {words.map(([word, stat]) => (
                      <tr key={word}>
                        <td>
                          <strong>{word}</strong>
                          <button
                            className='outline secondary'
                            style={{ margin: '0 0 0 6px', padding: '1px 5px', fontSize: '11px' }}
                            onClick={() => pronounce(word)}
                          >
                            🔊
                          </button>
                        </td>
                        <td style={{ color: '#2e7d32' }}>{stat.success}</td>
                        <td style={{ color: stat.fail > 0 ? '#d32f2f' : '#666' }}>{stat.fail}</td>
                        <td>
                          <a
                            href='#'
                            style={{ color: '#999', fontSize: '12px' }}
                            onClick={(e) => {
                              e.preventDefault()
                              deleteWord(word)
                            }}
                          >
                            Remove
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <footer>
              <button className='outline' onClick={() => setShowVocab(false)}>
                Close
              </button>
            </footer>
          </article>
        </dialog>
      )}
    </div>
  )
}
