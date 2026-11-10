import { computed, type ReadonlySignal, Signal, signal } from '@preact/signals'
import { app } from '../appv'
import type { WordStatItem } from '../util'

export type FilterType = 'all' | 'need_review' | 'passed'
export type SortType = 'mastery_worst' | 'fail_desc' | 'success_desc' | 'alpha'

export const vocabulary: {
  pager: Signal<{ current_page: number; page_size: number }>
  action: Signal<{ search: string; filter: FilterType; sort: SortType }>
  all_entries: ReadonlySignal<[string, WordStatItem][]>
  total_words: ReadonlySignal<number>
  passed_words: ReadonlySignal<number>
  need_review_words: ReadonlySignal<number>
  filtered_entries: ReadonlySignal<[string, WordStatItem][]>
  total_items: ReadonlySignal<number>
  total_pages: ReadonlySignal<number>
  safe_page: ReadonlySignal<number>
  paginated_entries: ReadonlySignal<[string, WordStatItem][]>
} = //
  {
    pager: signal({ current_page: 1, page_size: 20 }),

    action: signal<{ search: string; filter: FilterType; sort: SortType }>(
      {
        search: '',
        filter: 'all',
        sort: 'mastery_worst',
      },
    ),

    all_entries: computed(() => Object.entries(app.data.value.word_stat)),
    total_words: computed(() => vocabulary.all_entries.value.length),
    passed_words: computed(() => vocabulary.all_entries.value.filter(([, s]) => s.pass).length),
    need_review_words: computed(() => vocabulary.all_entries.value.filter(([, s]) => !s.pass && s.fail > 0).length),

    filtered_entries: computed(() =>
    {
      let list = vocabulary.all_entries.value
      const act = vocabulary.action.value

      if (act.search.trim())
      {
        const q = act.search.trim().toLowerCase()
        list = list.filter(([w]) => w.includes(q))
      }

      if (act.filter === 'passed')
      {
        list = list.filter(([, s]) => s.pass)
      } else if (act.filter === 'need_review')
      {
        list = list.filter(([, s]) => !s.pass && s.fail > 0)
      }

      list = [...list].sort(([wA, sA], [wB, sB]) =>
      {
        // 1. 掌握程度排序（最差在上面）
        if (act.sort === 'mastery_worst')
        {
          if (!!sA.pass !== !!sB.pass)
          {
            return sA.pass ? 1 : -1
          }

          const totalA = (sA.success || 0) + (sA.fail || 0)
          const totalB = (sB.success || 0) + (sB.fail || 0)
          const rateA = totalA > 0 ? (sA.success || 0) / totalA : 0
          const rateB = totalB > 0 ? (sB.success || 0) / totalB : 0

          if (Math.abs(rateA - rateB) > 0.05)
          {
            return rateA - rateB
          }
          if (sB.fail !== sA.fail)
          {
            return (sB.fail || 0) - (sA.fail || 0)
          }
          return totalB - totalA
        }

        // 2. 按生词次数 (Fail) 降序
        if (act.sort === 'fail_desc')
        {
          return (sB.fail || 0) - (sA.fail || 0)
            || ((sB.success || 0) + (sB.fail || 0)) - ((sA.success || 0) + (sA.fail || 0))
        }

        // 3. 按掌握次数 (Success) 降序
        if (act.sort === 'success_desc')
        {
          return (sB.success || 0) - (sA.success || 0) || (sB.fail || 0) - (sA.fail || 0)
        }

        // 4. 按字母顺序 (A-Z)
        return wA.localeCompare(wB)
      })

      return list
    }),

    total_items: computed(() => vocabulary.filtered_entries.value.length),
    total_pages: computed(() =>
      Math.max(1, Math.ceil(vocabulary.total_items.value / vocabulary.pager.value.page_size))
    ),
    safe_page: computed(() => Math.min(vocabulary.pager.value.current_page, vocabulary.total_pages.value)),

    paginated_entries: computed<[string, WordStatItem][]>(() =>
    {
      const start = (vocabulary.safe_page.value - 1) * vocabulary.pager.value.page_size
      return vocabulary.filtered_entries.value.slice(start, start + vocabulary.pager.value.page_size)
    }),
  }
