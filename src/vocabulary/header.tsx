import { app } from '../appv'
import { vocabulary } from './value'

export function HeaderPart()
{
  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200'>
      <div>
        <button
          type='button'
          onClick={onBack}
          className='inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer'
        >
          ← 返回视频列表
        </button>
        <div className='flex items-center gap-2'>
          <h1 className='text-xl font-semibold tracking-tight text-slate-900'>生词本 (Vocabulary)</h1>
          <span className='px-2 py-0.5 text-xs text-slate-500 bg-slate-100 rounded-md font-mono'>
            {vocabulary.total_words.value} 词
          </span>
        </div>
      </div>

      {/* Quick stats mini cards - 素雅中性纸质感 */}
      <div className='flex items-center gap-3'>
        <div className='bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-center shadow-2xs'>
          <div className='text-[11px] text-slate-400'>总收录</div>
          <div className='text-base font-semibold text-slate-800 font-mono'>{vocabulary.total_words.value}</div>
        </div>
        <div className='bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-center shadow-2xs'>
          <div className='text-[11px] text-emerald-600'>已掌握 (Pass)</div>
          <div className='text-base font-semibold text-emerald-700 font-mono'>{vocabulary.passed_words.value}</div>
        </div>
        <div className='bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-center shadow-2xs'>
          <div className='text-[11px] text-amber-600'>待攻克生词</div>
          <div className='text-base font-semibold text-amber-700 font-mono'>{vocabulary.need_review_words.value}</div>
        </div>
      </div>
    </div>
  )
}

function onBack()
{
  app.show_page.value = 'video_list'
}
