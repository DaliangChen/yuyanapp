import type { Signal } from '@preact/signals'
import type { PageInfo } from '../util'

export function PagerPart({ page_info }: { page_info: Signal<PageInfo> })
{
  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      <a href='#' onClick={() => on_click_first(page_info)}>{'<<'}</a>
      <a href='#' onClick={() => on_click_prev(page_info)}>{'<'}</a>
      <a href='#'>{page_info.value.current_page} / {page_info.value.total_pages}</a>
      <a href='#' onClick={() => on_click_next(page_info)}>{'>'}</a>
      <a href='#' onClick={() => on_click_last(page_info)}>{'>>'}</a>
    </div>
  )
}

function on_click_first(page_info: Signal<PageInfo>)
{
  page_info.value = { ...page_info.value, current_page: 1 }
}

function on_click_prev(page_info: Signal<PageInfo>)
{
  page_info.value = { ...page_info.value, current_page: Math.max(1, page_info.value.current_page - 1) }
}

function on_click_next(page_info: Signal<PageInfo>)
{
  page_info.value = {
    ...page_info.value,
    current_page: Math.min(page_info.value.total_pages, page_info.value.current_page + 1),
  }
}

function on_click_last(page_info: Signal<PageInfo>)
{
  page_info.value = { ...page_info.value, current_page: page_info.value.total_pages }
}
