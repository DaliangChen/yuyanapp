import { effect, signal } from '@preact/signals'
import type { VideoInfo, WordStatItem } from './util'

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
    data: signal<{ videos: VideoInfo[]; word_stat: Record<string, WordStatItem> }>(loadInitialData()),

    show_page: signal<'video_list' | 'video_player' | 'vocabulary'>('video_list'),
    err_info: signal<string | null>(null),
  }

const STORAGE_KEY = 'yuyan_app_data'

function loadInitialData()
{
  try
  {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved)
    {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.videos))
      {
        return parsed
      }
    }
  } catch (e)
  {
    console.warn('Failed to load data from localStorage', e)
  }
  return { videos: [], word_stat: {} }
}

effect(() =>
{
  try
  {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app.data.value))
  } catch (e)
  {
    throw new InfoError('数据保存失败')
  }
})
