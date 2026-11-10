import { signal } from '@preact/signals'

export type VideoInfo = {
  video_id: string
  srt_1: string
  srt_2: string
  note: string
  update_time: number
}

export type WordStatItem = //
  {
    /**
     * 掌握次数
     */
    success: number
    /**
     * 错误次数
     */
    fail: number
    /**
     * 是否掌握
     */
    pass?: boolean
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
    show_page: signal<'video_list' | 'video_player' | 'vocabulary'>('video_list'),
    err_info: signal<string | null>(null),
  }
