import type { ChangeEvent } from 'preact/compat'
import { app, default_never, InfoError } from '../appv'
import { video_list } from './value'

function extractYouTubeId(urlOrId: string): string
{
  const trimmed = urlOrId.trim()
  const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const match = trimmed.match(reg)
  return match ? match[1] : trimmed
}

const on_change_video_id = (e: ChangeEvent<HTMLInputElement>) =>
{
  if (!video_list.add_data.value) return
  const raw = e.currentTarget.value
  video_list.add_data.value.video_info.video_id = raw
}

const on_blur_video_id = (e: ChangeEvent<HTMLInputElement>) =>
{
  if (!video_list.add_data.value) return
  const cleanId = extractYouTubeId(e.currentTarget.value)
  video_list.add_data.value.video_info.video_id = cleanId
  e.currentTarget.value = cleanId
}

const on_change_note = (e: ChangeEvent<HTMLTextAreaElement>) =>
{
  if (!video_list.add_data.value) return
  video_list.add_data.value.video_info.note = e.currentTarget.value
}

const on_click_cancel = () => (video_list.add_data.value = null)

const on_click_confirm = () =>
{
  const add_value = video_list.add_data.value
  if (!add_value) return

  const cleanId = extractYouTubeId(add_value.video_info.video_id)
  if (!cleanId) throw new InfoError('请输入有效的 YouTube 视频 ID 或完整链接')
  add_value.video_info.video_id = cleanId

  switch (add_value.status)
  {
    case 'add':
      const has_same_id = app.data.value.videos.some(video => video.video_id === cleanId)
      if (has_same_id) throw new InfoError('该视频 ID 已存在列表中')
      app.data.value.videos.push({ ...add_value.video_info })
      break

    case 'edit':
      const video = app.data.value.videos.find(video => video.video_id === cleanId)
      if (!video) throw new InfoError('未找到对应的视频记录')
      video.note = add_value.video_info.note
      video.update_time = Date.now()
      break

    default:
      default_never(add_value.status)
  }

  app.data.value = { ...app.data.value }
  video_list.add_data.value = null
}

export function AddPart()
{
  if (!video_list.add_data.value) return null
  const isEditing = video_list.add_data.value?.status === 'edit'

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs'>
      <div className='w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150'>
        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
          <h3 className='text-base font-semibold text-slate-800'>
            {isEditing ? '编辑视频信息' : '添加 YouTube 视频'}
          </h3>
          <button
            type='button'
            onClick={on_click_cancel}
            className='text-slate-400 hover:text-slate-600 transition-colors text-sm cursor-pointer'
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); on_click_confirm(); }} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-medium text-slate-600'>
              YouTube 视频 ID 或 URL
            </label>
            <input
              type='text'
              placeholder='例如: M7lc1UVf-VE 或粘贴完整网页链接'
              value={video_list.add_data.value?.video_info.video_id}
              onInput={on_change_video_id}
              onBlur={on_blur_video_id}
              disabled={isEditing}
              className='w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 placeholder-slate-400 font-mono'
            />
            <span className='text-[11px] text-slate-400'>
              支持自动提取 11 位 YouTube 视频 ID
            </span>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-medium text-slate-600'>
              备注 / 标题
            </label>
            <textarea
              rows={3}
              placeholder='输入视频标题或语言学习笔记...'
              value={video_list.add_data.value?.video_info.note}
              onInput={on_change_note}
              className='w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all text-slate-800 placeholder-slate-400 resize-none'
            />
          </div>

          <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
            <button
              type='button'
              onClick={on_click_cancel}
              className='px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer'
            >
              取消
            </button>
            <button
              type='submit'
              className='px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer'
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
