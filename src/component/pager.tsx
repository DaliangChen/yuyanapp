import type { ReadonlySignal, Signal } from '@preact/signals'

export function PagerPart(
  {
    current_page,
    total_pages,
  }: {
    current_page: Signal<number>
    total_pages: number | ReadonlySignal<number>
  },
)
{
  const total_pages_num = typeof total_pages === 'number' ? total_pages : total_pages.value

  return (
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
      <a href='#' onClick={() => on_click_first(current_page)}>&lt;&lt;</a>
      <a href='#' onClick={() => on_click_prev(current_page)}>&lt;</a>
      <a href='#'>{current_page.value} / {total_pages_num}</a>
      <a href='#' onClick={() => on_click_next(current_page, total_pages_num)}>&gt;</a>
      <a href='#' onClick={() => on_click_last(current_page, total_pages_num)}>&gt;&gt;</a>
    </div>
  )
}

function on_click_first(current_page: Signal<number>)
{
  current_page.value = 1
}

function on_click_prev(current_page: Signal<number>)
{
  current_page.value = Math.max(1, current_page.value - 1)
}

function on_click_next(current_page: Signal<number>, total_pages: number)
{
  current_page.value = Math.min(total_pages, current_page.value + 1)
}

function on_click_last(current_page: Signal<number>, total_pages: number)
{
  current_page.value = total_pages
}
