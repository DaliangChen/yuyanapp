import { app } from '../appv'
import { video_player } from './value'

const onBack = () =>
{
  video_player.player.value?.pauseVideo()
  app.show_page.value = 'video_list'
}

export function ActionPart()
{
  const videoNote = video_player.video_info.value?.note || video_player.video_info.value?.video_id || ''
  const totalWords = Object.keys(app.data.value.word_stat || {}).length

  return (
    <>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200'>
        <div>
          <button
            type='button'
            onClick={onBack}
            className='inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer'
          >
            ← 返回视频列表
          </button>
          <div className='flex items-center gap-2.5'>
            <h1 className='text-lg font-semibold tracking-tight text-slate-900 truncate max-w-md' title={videoNote}>
              {videoNote}
            </h1>
            <code className='text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded'>
              {video_player.video_info.value.video_id}
            </code>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() =>
            {
              video_player.player.value?.pauseVideo()
              app.show_page.value = 'vocabulary'
            }}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer'
          >
            <span>📖 生词本</span>
            <span className='px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]'>
              {totalWords}
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
