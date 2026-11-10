import { type SortType, vocabulary } from './value'

export function ActionPart()
{
  const act = vocabulary.action.value

  return (
    <div className='flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs'>
      <div className='flex-1 max-w-sm relative'>
        <input
          type='text'
          placeholder='🔍 搜索生词或拼写...'
          value={act.search}
          onInput={(e) => vocabulary.setSearch(e.currentTarget.value)}
          className='w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white text-slate-800 placeholder-slate-400'
        />
      </div>

      <div className='flex flex-wrap items-center gap-2.5'>
        {/* Filter tabs */}
        <div className='inline-flex bg-slate-100 p-0.5 rounded-lg text-xs'>
          <button
            type='button'
            onClick={() => vocabulary.setFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              act.filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            全部 ({vocabulary.total_words.value})
          </button>
          <button
            type='button'
            onClick={() => vocabulary.setFilter('need_review')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              act.filter === 'need_review'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            待复习 ({vocabulary.need_review_words.value})
          </button>
          <button
            type='button'
            onClick={() => vocabulary.setFilter('passed')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              act.filter === 'passed'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            已掌握 ({vocabulary.passed_words.value})
          </button>
        </div>

        {/* Sort dropdown */}
        <div className='flex items-center gap-1.5'>
          <span className='text-xs text-slate-400'>排序:</span>
          <select
            value={act.sort}
            onChange={(e) => vocabulary.setSort(e.currentTarget.value as SortType)}
            className='text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer'
          >
            <option value='mastery_worst'>按掌握程度 (最差在上面)</option>
            <option value='fail_desc'>按生词次数 (Fail) 降序</option>
            <option value='success_desc'>按掌握次数 (Success) 降序</option>
            <option value='alpha'>按字母顺序 (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
