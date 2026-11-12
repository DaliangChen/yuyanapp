import { signal } from '@preact/signals'
import * as localforage from 'localforage'
import { type AppData } from './util'

const STORAGE_KEY = 'yuyan_app_data'

export const data = signal<AppData>({ videos: [], word_stat: {} })
localforage.getItem(STORAGE_KEY).then((value) =>
{
  if (value) data.value = value as AppData
})

export const visibilitychange = () =>
{
  if (document.visibilityState === 'visible') return
  localforage.setItem(STORAGE_KEY, data.value)
}

export const show_page = signal<'video_list' | 'video_player' | 'vocabulary' | 'srt_editer'>('video_list')

export const err_info = signal<string | null>(null)
