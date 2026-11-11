import * as vocabulary from './value'

export function ActionPart()
{
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ flex: '1', minWidth: '220px', maxWidth: '360px' }}>
        <input
          type='search'
          placeholder='Search word...'
          value={vocabulary.search.value}
          onInput={(e) => on_search(e.currentTarget.value)}
        />
      </div>

      <div role='group' style={{ width: 'fit-content' }}>
        <button
          className={vocabulary.filter.value === 'all' ? '' : 'outline'}
          onClick={() => on_filter('all')}
        >
          All ({vocabulary.total_words.value})
        </button>
        <button
          className={vocabulary.filter.value === 'need_review' ? '' : 'outline'}
          onClick={() => on_filter('need_review')}
        >
          Review ({vocabulary.need_review_words.value})
        </button>
        <button
          className={vocabulary.filter.value === 'passed' ? '' : 'outline'}
          onClick={() => on_filter('passed')}
        >
          Passed ({vocabulary.passed_words.value})
        </button>
      </div>
    </div>
  )
}

function on_search(q: string)
{
  vocabulary.search.value = q
  vocabulary.current_page.value = 1
}

function on_filter(f: vocabulary.FilterType)
{
  vocabulary.filter.value = f
  vocabulary.current_page.value = 1
}
