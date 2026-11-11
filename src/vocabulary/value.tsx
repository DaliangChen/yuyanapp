import { computed, signal } from '@preact/signals'
import { app } from '../appv'

export type FilterType = 'all' | 'need_review' | 'passed'

/*******************************************************************************************
 * 筛选与搜索
 */

export const search = signal('')
export const filter = signal<FilterType>('all')

/*******************************************************************************************
 * 分页数据
 */

export const page_size = signal(15)
export const current_page = signal(1)

/*******************************************************************************************
 * 统计与列表数据
 */

export const all_entries = computed(() => Object.entries(app.data.value.word_stat))
export const total_words = computed(() => all_entries.value.length)
export const passed_words = computed(() => all_entries.value.filter(([, pass]) => pass).length)
export const need_review_words = computed(() => all_entries.value.filter(([, pass]) => !pass).length)

export const filtered_entries = computed(() =>
{
  let list = all_entries.value
  const q = search.value.trim().toLowerCase()

  if (q)
  {
    list = list.filter(([word]) => word.toLowerCase().includes(q))
  }

  if (filter.value === 'passed')
  {
    list = list.filter(([, pass]) => pass)
  } else if (filter.value === 'need_review')
  {
    list = list.filter(([, pass]) => !pass)
  }

  // 排序：生词排在前面，已掌握排在后面，同类按字母排序
  return [...list].sort(([wA, passA], [wB, passB]) =>
  {
    if (passA !== passB)
    {
      return passA ? 1 : -1
    }
    return wA.localeCompare(wB)
  })
})

export const total_pages = computed(() => Math.max(1, Math.ceil(filtered_entries.value.length / page_size.value)))

export const paginated_entries = computed(() =>
{
  const start = (current_page.value - 1) * page_size.value
  return filtered_entries.value.slice(start, start + page_size.value)
})
