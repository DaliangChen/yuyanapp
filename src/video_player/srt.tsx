import { signal } from '@preact/signals'
import type { RefObject } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import * as video_player from './value'

const list_ref = signal<RefObject<HTMLDivElement> | null>(null)
const active_ref = signal<RefObject<HTMLElement> | null>(null)

export function SrtPart()
{
  const list_ref_dom = useRef<HTMLDivElement>(null)
  const active_ref_dom = useRef<HTMLElement | null>(null)

  useEffect(() =>
  {
    list_ref.value = list_ref_dom
    active_ref.value = active_ref_dom
  }, [list_ref_dom, active_ref_dom])

  return (
    <div
      ref={list_ref_dom}
      style={{
        height: 'calc(100vh - 130px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingRight: '6px',
        boxSizing: 'border-box',
      }}
    >
      {video_player.video_info.value?.sentense_list.map((sentense) =>
      {
        return (
          <article key={sentense.index}>
            {sentense.text}
            <br />
            {sentense.translation}
          </article>
        )
      })}
    </div>
  )
}
