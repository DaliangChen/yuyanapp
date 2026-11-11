import { type FilterType, type SortType, vocabulary } from './value'

export function ActionPart()
{
  const act = vocabulary.action.value

  return (
    <div>
      <div>
        <input
          type='text'
          placeholder='🔍 搜索生词或拼写...'
          value={act.search}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <div>
        <div>
          <button
            type='button'
            onClick={() => setFilter('all')}
          >
            全部 ({vocabulary.total_words.value})
          </button>
          <button
            type='button'
            onClick={() => setFilter('need_review')}
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
            onClick={() => setFilter('passed')}
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
            onChange={(e) => setSort(e.currentTarget.value as SortType)}
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

function setSort(sort: SortType)
{
  vocabulary.action.value = { ...vocabulary.action.value, sort }
  vocabulary.pager.value = { ...vocabulary.pager.value, current_page: 1 }
}

function setFilter(filter: FilterType)
{
  vocabulary.action.value = { ...vocabulary.action.value, filter }
  vocabulary.pager.value = { ...vocabulary.pager.value, current_page: 1 }
}

function setSearch(search: string)
{
  vocabulary.action.value = { ...vocabulary.action.value, search }
  vocabulary.pager.value = { ...vocabulary.pager.value, current_page: 1 }
}
