import { computed, signal } from '@preact/signals'
import { video_list } from '../video_list/value'

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
  }

export type FilterType = 'all' | 'need_review' | 'passed'
export type SortType = 'mastery_worst' | 'fail_desc' | 'success_desc' | 'alpha'
