import { signal } from '@preact/signals'

export type VideoInfo = {
  video_id: string
  srt: string
  note: string
  update_time: number
}

export class InfoError extends Error
{
  constructor(message: string)
  {
    super(message)
    this.name = 'InfoError'
  }
}

export class LogicError extends Error
{
  constructor()
  {
    super('Logic Error')
    this.name = 'LogicError'
  }
}

export function default_never(x: never): never
{
  return x as never
}

export const app = //
  {
    show_page: signal<'video_list' | 'video_player'>('video_list'),
    err_info: signal<string | null>(null),
  }
