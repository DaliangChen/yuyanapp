import { effect, signal } from '@preact/signals'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import type { VideoInfo } from '../util'

export const player = signal<YouTubePlayer | null>(null)
export const video_info = signal<VideoInfo | null>(null)
export const current_time = signal<number>(0)
export const is_playing = signal<boolean>(false)
export const is_skip_familiar = signal<boolean>(false)

effect(() =>
{
  if (is_playing.value) player.value?.playVideo()
  else player.value?.pauseVideo()
})
