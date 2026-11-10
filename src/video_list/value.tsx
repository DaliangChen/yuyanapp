import { effect, signal } from '@preact/signals'
import { InfoError, type VideoInfo, type WordStatItem } from '../appv'

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

export const video_list = //
  {
    data: signal<{ videos: VideoInfo[]; word_stat: Record<string, WordStatItem> }>(loadInitialData()),

    add_data: signal<{ video_info: VideoInfo; status: 'add' | 'edit' } | null>(null),
  }

effect(() =>
{
  try
  {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(video_list.data.value))
  } catch (e)
  {
    throw new InfoError('数据保存失败')
  }
})
