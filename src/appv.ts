import { effect, signal } from '@preact/signals'
import { type AppData, InfoError } from './util'

const STORAGE_KEY = 'yuyan_app_data'

export const app = //
  {
    data: signal<AppData>(loadInitialData()),

    show_page: signal<'video_list' | 'video_player' | 'vocabulary'>('video_list'),

    err_info: signal<string | null>(null),
  }

function loadInitialData(): AppData
{
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return JSON.parse(saved) as AppData

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
