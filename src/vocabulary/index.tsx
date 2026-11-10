import { useMemo } from 'preact/hooks'
import { video_list } from '../video_list/value'
import { ActionPart } from './action'
import { HeaderPart } from './header'
import { PagerPart } from './pager'
import { TablePart } from './table'
import { vocabulary } from './value'

export function VocabularyPage()
{
  // Filter & Sort
  const filteredEntries = useMemo(() =>
  {
    let list = vocabulary.all_entries.value

    if (vocabulary.action.value.search.trim())
    {
      const q = vocabulary.action.value.search.trim().toLowerCase()
      list = list.filter(([w]) => w.includes(q))
    }

    if (vocabulary.action.value.filter === 'passed')
    {
      list = list.filter(([, s]) => s.pass)
    } else if (vocabulary.action.value.filter === 'need_review')
    {
      list = list.filter(([, s]) => !s.pass && s.fail > 0)
    }

    list = [...list].sort(([wA, sA], [wB, sB]) =>
    {
      // 1. 掌握程度排序（最差在上面）
      if (vocabulary.action.value.sort === 'mastery_worst')
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
      if (vocabulary.action.value.sort === 'fail_desc')
      {
        return (sB.fail || 0) - (sA.fail || 0)
          || ((sB.success || 0) + (sB.fail || 0)) - ((sA.success || 0) + (sA.fail || 0))
      }

      // 3. 按掌握次数 (Success) 降序
      if (vocabulary.action.value.sort === 'success_desc')
      {
        return (sB.success || 0) - (sA.success || 0) || (sB.fail || 0) - (sA.fail || 0)
      }

      // 4. 字母顺序
      return wA.localeCompare(wB)
    })

    return list
  }, [
    vocabulary.all_entries.value,
    vocabulary.action.value.search,
    vocabulary.action.value.filter,
    vocabulary.action.value.sort,
  ])

  // Pagination calculation
  const totalItems = filteredEntries.length
  const totalPages = Math.max(1, Math.ceil(totalItems / vocabulary.pager.value.page_size))
  const safePage = Math.min(vocabulary.pager.value.current_page, totalPages)

  const paginatedEntries = useMemo(() =>
  {
    const start = (safePage - 1) * vocabulary.pager.value.page_size
    return filteredEntries.slice(start, start + vocabulary.pager.value.page_size)
  }, [filteredEntries, safePage, vocabulary.pager.value.page_size])

  const togglePass = (word: string) =>
  {
    const stat = vocabulary.word_stats[word]
    if (stat)
    {
      stat.pass = !stat.pass
      video_list.data.value = { ...video_list.data.value }
    }
  }

  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * vocabulary.pager.value.page_size + 1
  const endIdx = Math.min(safePage * vocabulary.pager.value.page_size, totalItems)

  return (
    <div className='max-w-5xl mx-auto px-4 py-8 min-h-screen flex flex-col gap-6 text-slate-800'>
      {/* Top Header */}
      <HeaderPart />

      {/* Filter and search toolbar */}
      <ActionPart />

      {/* Words Table */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden'>
        {paginatedEntries.length === 0
          ? (
            <div className='flex flex-col items-center justify-center p-14 text-center'>
              <div className='text-2xl mb-2 text-slate-300'>📖</div>
              <p className='text-sm font-medium text-slate-700'>没有匹配的生词</p>
              <p className='text-xs text-slate-400 mt-1 max-w-sm'>
                在视频播放中按 ←（左箭头）或向前滚动鼠标滚轮，即可整句加入生词本。
              </p>
            </div>
          )
          : (
            TablePart(paginatedEntries, togglePass)
          )}

        {/* Pagination Bar - 素雅分页控制器 */}
        {totalItems > 0 && (
          PagerPart(
            startIdx,
            endIdx,
            totalItems,
            safePage,
            totalPages,
          )
        )}
      </div>
    </div>
  )
}
