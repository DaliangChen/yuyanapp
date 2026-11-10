import { effect, signal } from '@preact/signals'
import { InfoError, type VideoInfo, type WordStatItem } from '../appv'

const STORAGE_KEY = 'yuyan_app_data'

const defaultData = {
  videos: [
    {
      video_id: 'M7lc1UVf-VE',
      srt_1: `1
00:00:00,000 --> 00:00:04,000
Welcome to YuYan language learning player!

2
00:00:04,500 --> 00:00:09,000
Click on any subtitle to jump to that timestamp in the video.

3
00:00:09,500 --> 00:00:15,000
You can add your own YouTube videos and SRT/VTT subtitle files.`,
      srt_2: `1
00:00:00,000 --> 00:00:04,000
欢迎使用语言 (YuYan) 学习播放器！

2
00:00:04,500 --> 00:00:09,000
点击任意字幕即可直接跳转到对应视频时间点。

3
00:00:09,500 --> 00:00:15,000
你可以添加自己的 YouTube 视频与 SRT/VTT 双语字幕文件。`,
      note: 'YouTube API Demo Video with bilingual subtitles',
      update_time: Date.now(),
    },
  ],
  word_stat: {},
}

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
  return defaultData
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
