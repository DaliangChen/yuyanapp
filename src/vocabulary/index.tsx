import { useMemo, useState } from 'preact/hooks'
import { app } from '../appv'
import { video_list } from '../video_list/value'

type FilterType = 'all' | 'need_review' | 'passed'
type SortType = 'mastery_worst' | 'fail_desc' | 'success_desc' | 'alpha'

export function VocabularyPage()
{
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('mastery_worst')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const wordStats = video_list.data.value.word_stat || {}
  const allEntries = Object.entries(wordStats)

  const totalWords = allEntries.length
  const passedWords = allEntries.filter(([, s]) => s.pass).length
  const needReviewWords = allEntries.filter(([, s]) => !s.pass && s.fail > 0).length

  // Filter & Sort
  const filteredEntries = useMemo(() =>
  {
    let list = allEntries

    if (search.trim())
    {
      const q = search.trim().toLowerCase()
      list = list.filter(([w]) => w.includes(q))
    }

    if (filter === 'passed')
    {
      list = list.filter(([, s]) => s.pass)
    }
    else if (filter === 'need_review')
    {
      list = list.filter(([, s]) => !s.pass && s.fail > 0)
    }

    list = [...list].sort(([wA, sA], [wB, sB]) =>
    {
      // 1. 掌握程度排序（最差在上面）
      if (sort === 'mastery_worst')
      {
        // 如果其中一个是 Pass，另一个不是，Pass 的沉底
        if (!!sA.pass !== !!sB.pass)
        {
          return sA.pass ? 1 : -1
        }

        // 计算未掌握度（以错误率和错误次数为主）
        const totalA = (sA.success || 0) + (sA.fail || 0)
        const totalB = (sB.success || 0) + (sB.fail || 0)
        const rateA = totalA > 0 ? (sA.success || 0) / totalA : 0
        const rateB = totalB > 0 ? (sB.success || 0) / totalB : 0

        // 掌握率越低，越差，排在前面
        if (Math.abs(rateA - rateB) > 0.05)
        {
          return rateA - rateB
        }
        // 若掌握率相近，则 fail 越多的排在前面
        if (sB.fail !== sA.fail)
        {
          return (sB.fail || 0) - (sA.fail || 0)
        }
        return totalB - totalA
      }

      // 2. 按生词次数 (Fail) 降序
      if (sort === 'fail_desc')
      {
        return (sB.fail || 0) - (sA.fail || 0) || ((sB.success || 0) + (sB.fail || 0)) - ((sA.success || 0) + (sA.fail || 0))
      }

      // 3. 按掌握次数 (Success) 降序
      if (sort === 'success_desc')
      {
        return (sB.success || 0) - (sA.success || 0) || (sB.fail || 0) - (sA.fail || 0)
      }

      // 4. 字母顺序
      return wA.localeCompare(wB)
    })

    return list
  }, [allEntries, search, filter, sort])

  // Pagination calculation
  const totalItems = filteredEntries.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedEntries = useMemo(() =>
  {
    const start = (safePage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, safePage, pageSize])

  const handleSearchChange = (val: string) =>
  {
    setSearch(val)
    setCurrentPage(1)
  }

  const handleFilterChange = (f: FilterType) =>
  {
    setFilter(f)
    setCurrentPage(1)
  }

  const handleSortChange = (s: SortType) =>
  {
    setSort(s)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) =>
  {
    setPageSize(size)
    setCurrentPage(1)
  }

  const pronounce = (word: string) =>
  {
    if ('speechSynthesis' in window)
    {
      const u = new SpeechSynthesisUtterance(word)
      u.lang = 'de-DE'
      window.speechSynthesis.speak(u)
    }
  }

  const togglePass = (word: string) =>
  {
    const stat = wordStats[word]
    if (stat)
    {
      stat.pass = !stat.pass
      video_list.data.value = { ...video_list.data.value }
    }
  }

  const deleteWord = (word: string) =>
  {
    delete video_list.data.value.word_stat[word]
    video_list.data.value = { ...video_list.data.value }
  }

  const onBack = () =>
  {
    app.show_page.value = 'video_list'
  }

  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIdx = Math.min(safePage * pageSize, totalItems)

  return (
    <div className='max-w-5xl mx-auto px-4 py-8 min-h-screen flex flex-col gap-6 text-slate-800'>
      {/* Top Header */}
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
              {totalWords} 词
            </span>
          </div>
        </div>

        {/* Quick stats mini cards - 素雅中性纸质感 */}
        <div className='flex items-center gap-3'>
          <div className='bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-center shadow-2xs'>
            <div className='text-[11px] text-slate-400'>总收录</div>
            <div className='text-base font-semibold text-slate-800 font-mono'>{totalWords}</div>
          </div>
          <div className='bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-center shadow-2xs'>
            <div className='text-[11px] text-emerald-600'>已掌握 (Pass)</div>
            <div className='text-base font-semibold text-emerald-700 font-mono'>{passedWords}</div>
          </div>
          <div className='bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-center shadow-2xs'>
            <div className='text-[11px] text-amber-600'>待攻克生词</div>
            <div className='text-base font-semibold text-amber-700 font-mono'>{needReviewWords}</div>
          </div>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className='flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs'>
        <div className='flex-1 max-w-sm relative'>
          <input
            type='text'
            placeholder='🔍 搜索生词或拼写...'
            value={search}
            onInput={(e) => handleSearchChange(e.currentTarget.value)}
            className='w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white text-slate-800 placeholder-slate-400'
          />
        </div>

        <div className='flex flex-wrap items-center gap-2.5'>
          {/* Filter tabs */}
          <div className='inline-flex bg-slate-100 p-0.5 rounded-lg text-xs'>
            <button
              type='button'
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({totalWords})
            </button>
            <button
              type='button'
              onClick={() => handleFilterChange('need_review')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'need_review'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              待复习 ({needReviewWords})
            </button>
            <button
              type='button'
              onClick={() => handleFilterChange('passed')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'passed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              已掌握 ({passedWords})
            </button>
          </div>

          {/* Sort dropdown */}
          <div className='flex items-center gap-1.5'>
            <span className='text-xs text-slate-400'>排序:</span>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.currentTarget.value as SortType)}
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

      {/* Words Table */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden'>
        {paginatedEntries.length === 0 ? (
          <div className='flex flex-col items-center justify-center p-14 text-center'>
            <div className='text-2xl mb-2 text-slate-300'>📖</div>
            <p className='text-sm font-medium text-slate-700'>没有匹配的生词</p>
            <p className='text-xs text-slate-400 mt-1 max-w-sm'>
              在视频播放中按 ←（左箭头）或向前滚动鼠标滚轮，即可整句加入生词本。
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200'>
                <tr>
                  <th scope='col' className='py-3 px-4 w-[220px]'>单词 (Word)</th>
                  <th scope='col' className='py-3 px-4 w-[130px]'>已掌握 (Pass)</th>
                  <th scope='col' className='py-3 px-4 w-[110px]'>熟练度 (Success)</th>
                  <th scope='col' className='py-3 px-4 w-[110px]'>生词标记 (Fail)</th>
                  <th scope='col' className='py-3 px-4 w-[100px]'>总打卡</th>
                  <th scope='col' className='py-3 px-4'>掌握程度</th>
                  <th scope='col' className='py-3 px-4 w-[70px] text-right'>操作</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 text-slate-700'>
                {paginatedEntries.map(([word, stat]) =>
                {
                  const total = (stat.success || 0) + (stat.fail || 0)
                  const rate = total > 0 ? Math.round((stat.success / total) * 100) : 0
                  const isPassed = !!stat.pass

                  return (
                    <tr
                      key={word}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isPassed ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      <td className='py-3 px-4'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`font-medium text-sm ${
                              isPassed
                                ? 'text-slate-400 line-through decoration-slate-300'
                                : stat.fail >= 3
                                ? 'text-amber-800 font-semibold'
                                : 'text-slate-900'
                            }`}
                          >
                            {word}
                          </span>
                          <button
                            type='button'
                            onClick={() => pronounce(word)}
                            className='text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs p-0.5'
                            title='发音'
                          >
                            🔊
                          </button>
                        </div>
                      </td>
                      <td className='py-3 px-4'>
                        <button
                          type='button'
                          onClick={() => togglePass(word)}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPassed ? '✓ 已掌握' : '未标记'}
                        </button>
                      </td>
                      <td className='py-3 px-4 text-emerald-600 font-medium font-mono'>
                        {stat.success || 0}
                      </td>
                      <td className='py-3 px-4 font-mono'>
                        <span className={stat.fail > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'}>
                          {stat.fail || 0}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-slate-400 font-mono text-[11px]'>
                        {total} 次
                      </td>
                      <td className='py-3 px-4'>
                        <div className='flex items-center gap-2 max-w-[160px]'>
                          <div className='flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isPassed
                                  ? 'bg-emerald-500'
                                  : rate >= 70
                                  ? 'bg-emerald-400'
                                  : rate >= 40
                                  ? 'bg-sky-400'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${isPassed ? 100 : rate}%` }}
                            />
                          </div>
                          <span className='text-[11px] text-slate-400 font-mono w-9 text-right'>
                            {isPassed ? '100%' : `${rate}%`}
                          </span>
                        </div>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        <button
                          type='button'
                          onClick={() => deleteWord(word)}
                          className='text-slate-400 hover:text-rose-600 transition-colors cursor-pointer text-xs'
                          title='从生词本中移除'
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar - 素雅分页控制器 */}
        {totalItems > 0 && (
          <div className='flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500'>
            <div className='flex items-center gap-2'>
              <span>
                显示第 <strong className='text-slate-700'>{startIdx}</strong> - <strong className='text-slate-700'>{endIdx}</strong> 条
              </span>
              <span>/</span>
              <span>共 <strong className='text-slate-700'>{totalItems}</strong> 个词</span>
            </div>

            <div className='flex items-center gap-3'>
              {/* Page size picker */}
              <div className='flex items-center gap-1.5'>
                <span>每页:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.currentTarget.value, 10))}
                  className='bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none cursor-pointer'
                >
                  <option value={15}>15 条</option>
                  <option value={25}>25 条</option>
                  <option value={50}>50 条</option>
                </select>
              </div>

              {/* Prev / Page / Next */}
              <div className='flex items-center gap-1.5'>
                <button
                  type='button'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className='px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer'
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
