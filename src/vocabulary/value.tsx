import { computed, signal } from '@preact/signals'
import type { WordStatItem } from '../appv'
import { video_list } from '../video_list/value'

export type FilterType = 'all' | 'need_review' | 'passed'
export type SortType = 'mastery_worst' | 'fail_desc' | 'success_desc' | 'alpha'

export const vocabulary = //
  {
    pager: signal(
      {
        current_page: 1,
        page_size: 20,
      },
    ),

    action: signal<{ search: string; filter: FilterType; sort: SortType }>(
      {
        search: '',
        filter: 'all',
        sort: 'mastery_worst',
      },
    ),

    word_stats: computed(() => video_list.data.value.word_stat || {}),
    all_entries: computed(() => Object.entries(vocabulary.word_stats.value)),
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
      }
      else if (act.filter === 'need_review')
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
    total_pages: computed(() => Math.max(1, Math.ceil(vocabulary.total_items.value / vocabulary.pager.value.page_size))),
    safe_page: computed(() => Math.min(vocabulary.pager.value.current_page, vocabulary.total_pages.value)),

    paginated_entries: computed<[string, WordStatItem][]>(() =>
    {
      const start = (vocabulary.safe_page.value - 1) * vocabulary.pager.value.page_size
      return vocabulary.filtered_entries.value.slice(start, start + vocabulary.pager.value.page_size)
    }),

    start_idx: computed(() =>
    {
      const total = vocabulary.total_items.value
      return total === 0 ? 0 : (vocabulary.safe_page.value - 1) * vocabulary.pager.value.page_size + 1
    }),

    end_idx: computed(() =>
    {
      return Math.min(vocabulary.safe_page.value * vocabulary.pager.value.page_size, vocabulary.total_items.value)
    }),

    setSearch: (search: string) =>
    {
      vocabulary.action.value = { ...vocabulary.action.value, search }
      vocabulary.pager.value = { ...vocabulary.pager.value, current_page: 1 }
    },

    setFilter: (filter: FilterType) =>
    {
      vocabulary.action.value = { ...vocabulary.action.value, filter }
      vocabulary.pager.value = { ...vocabulary.pager.value, current_page: 1 }
    },

    setSort: (sort: SortType) =>
    {
      vocabulary.action.value = { ...vocabulary.action.value, sort }
      vocabulary.pager.value = { ...vocabulary.pager.value, current_page: 1 }
    },

    setPage: (current_page: number) =>
    {
      vocabulary.pager.value = { ...vocabulary.pager.value, current_page }
    },

    setPageSize: (page_size: number) =>
    {
      vocabulary.pager.value = { page_size, current_page: 1 }
    },

    togglePass: (word: string) =>
    {
      const currentStat = video_list.data.value.word_stat[word]
      if (currentStat)
      {
        const newWordStat = {
          ...video_list.data.value.word_stat,
          [word]: {
            ...currentStat,
            pass: !currentStat.pass,
          },
        }
        video_list.data.value = {
          ...video_list.data.value,
          word_stat: newWordStat,
        }
      }
    },

    deleteWord: (word: string) =>
    {
      const newWordStat = { ...video_list.data.value.word_stat }
      delete newWordStat[word]
      video_list.data.value = {
        ...video_list.data.value,
        word_stat: newWordStat,
      }
    },
  }
