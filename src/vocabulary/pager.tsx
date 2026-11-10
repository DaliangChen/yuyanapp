import { vocabulary } from './value'

interface PagerPartProps
{
  startIdx?: number
  endIdx?: number
  totalItems?: number
  safePage?: number
  totalPages?: number
}

export function PagerPart(props?: PagerPartProps)
{
  const totalItems = props?.totalItems ?? vocabulary.total_items.value
  const startIdx = props?.startIdx ?? vocabulary.start_idx.value
  const endIdx = props?.endIdx ?? vocabulary.end_idx.value
  const safePage = props?.safePage ?? vocabulary.safe_page.value
  const totalPages = props?.totalPages ?? vocabulary.total_pages.value
  const pageSize = vocabulary.pager.value.page_size

  if (totalItems === 0) return null

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500'>
      <div className='flex items-center gap-2'>
        <span>
          显示第 <strong className='text-slate-700'>{startIdx}</strong> -{' '}
          <strong className='text-slate-700'>{endIdx}</strong> 条
        </span>
        <span>/</span>
        <span>
          共 <strong className='text-slate-700'>{totalItems}</strong> 个词
        </span>
      </div>

      <div className='flex items-center gap-3'>
        {/* Page size picker */}
        <div className='flex items-center gap-1.5'>
          <span>每页:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.currentTarget.value, 10))}
            className='bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none cursor-pointer'
          >
            <option value={10}>10 条</option>
            <option value={20}>20 条</option>
            <option value={30}>30 条</option>
            <option value={50}>50 条</option>
          </select>
        </div>

        {/* Prev / Page / Next */}
        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            className='px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer'
          >
            上一页
          </button>
          <span className='px-2 py-1 font-mono text-[11px] text-slate-600'>
            {safePage} / {totalPages}
          </span>
          <button
            type='button'
            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            className='px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer'
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}

function setPageSize(page_size: number)
{
  vocabulary.pager.value = { page_size, current_page: 1 }
}
function setPage(current_page: number)
{
  vocabulary.pager.value = { ...vocabulary.pager.value, current_page }
}
