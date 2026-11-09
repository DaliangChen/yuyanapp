import { app, LogicError, type VideoInfo } from '../appv'
import { video_player } from '../video_player/value'
import { video_list } from './value'

export function TablePart()
{
  const sortedVideos = [...video_list.data.value.videos].sort((a, b) => b.update_time - a.update_time)

  if (sortedVideos.length === 0)
  {
    return (
      <div className='flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs'>
        <div className='text-3xl mb-2 text-slate-300'>🎬</div>
        <p className='text-sm font-medium text-slate-700'>暂无学习视频</p>
        <p className='text-xs text-slate-400 mt-1'>
          点击上方 “+ 添加视频” 录入 YouTube 视频或导入本地学习数据。
        </p>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-xs'>
          <thead className='bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200'>
            <tr>
              <th scope='col' className='py-3.5 px-4 w-[240px]'>视频 ID / 播放</th>
              <th scope='col' className='py-3.5 px-4 w-[110px]'>主字幕 (Srt 1)</th>
              <th scope='col' className='py-3.5 px-4 w-[110px]'>副字幕 (Srt 2)</th>
              <th scope='col' className='py-3.5 px-4'>备注说明</th>
              <th scope='col' className='py-3.5 px-4 w-[120px] text-right'>操作</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 text-slate-700'>
            {sortedVideos.map((video) => (
              <tr key={video.video_id} className='hover:bg-slate-50/60 transition-colors'>
                <td className='py-3.5 px-4'>
                  <div className='flex items-center gap-2.5'>
                    <button
                      type='button'
                      onClick={() => on_click_play(video)}
                      className='inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer'
                      title='开始全屏学习播放'
                    >
                      <span>▶</span>
                      <span>播放</span>
                    </button>
                    <code className='text-[11px] font-mono text-slate-500 bg-slate-100/70 px-1.5 py-0.5 rounded'>
                      {video.video_id}
                    </code>
                  </div>
                </td>
                <td className='py-3.5 px-4'>
                  {video.srt_1 ? (
                    <span className='inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded'>
                      ✓ 已加载
                    </span>
                  ) : (
                    <button
                      type='button'
                      onClick={() => on_click_load(video.video_id, 'srt_1')}
                      className='text-[11px] text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-2 cursor-pointer'
                    >
                      载入字幕
                    </button>
                  )}
                </td>
                <td className='py-3.5 px-4'>
                  {video.srt_2 ? (
                    <span className='inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded'>
                      ✓ 已加载
                    </span>
                  ) : (
                    <button
                      type='button'
                      onClick={() => on_click_load(video.video_id, 'srt_2')}
                      className='text-[11px] text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-2 cursor-pointer'
                    >
                      载入字幕
                    </button>
                  )}
                </td>
                <td className='py-3.5 px-4 text-slate-600'>
                  {video.note ? (
                    <span className='line-clamp-1' title={video.note}>
                      {video.note}
                    </span>
                  ) : (
                    <span className='text-slate-400 italic text-[11px]'>无备注</span>
                  )}
                </td>
                <td className='py-3.5 px-4 text-right'>
                  <div className='flex items-center justify-end gap-3'>
                    <button
                      type='button'
                      onClick={() => on_click_edit(video)}
                      className='text-slate-500 hover:text-slate-900 transition-colors cursor-pointer text-xs'
                    >
                      编辑
                    </button>
                    <button
                      type='button'
                      onClick={() => on_click_delete(video.video_id)}
                      className='text-rose-500 hover:text-rose-700 transition-colors cursor-pointer text-xs'
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function on_click_edit(video: VideoInfo)
{
  video_list.add_data.value = { video_info: video, status: 'edit' }
}

async function on_click_load(video_id: string, srt_type: 'srt_1' | 'srt_2')
{
  let srt_text = ''
  try {
    if ('showOpenFilePicker' in window) {
      const [handle] = await window.showOpenFilePicker(
        {
          multiple: false,
          types: [
            {
              description: 'VTT / SRT',
              accept: {
                'text/vtt': ['.vtt'],
                'text/srt': ['.srt'],
              },
            },
          ],
        },
      )
      const file = await handle.getFile()
      srt_text = await file.text()
    } else {
      throw new Error('Native file picker not supported')
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') return
    // Fallback file input
    srt_text = await new Promise<string>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.vtt,.srt,text/vtt,text/plain'
      input.style.display = 'none'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (file) {
          resolve(await file.text())
        } else {
          resolve('')
        }
        document.body.removeChild(input)
      }
      document.body.appendChild(input)
      input.click()
    })
  }

  if (!srt_text) return

  const video = video_list.data.value.videos.find(v => v.video_id === video_id)
  if (!video) throw new LogicError()

  if (srt_type === 'srt_1') video.srt_1 = srt_text
  else video.srt_2 = srt_text
  video.update_time = Date.now()
  video_list.data.value = { ...video_list.data.value }
}

function on_click_delete(videoId: string)
{
  video_list.data.value.videos = video_list.data.value.videos.filter(v => v.video_id !== videoId)
  video_list.data.value = { ...video_list.data.value }
}

function on_click_play(video: VideoInfo)
{
  video_player.video_info.value = video
  app.show_page.value = 'video_player'
}
