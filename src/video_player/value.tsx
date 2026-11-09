import { signal } from '@preact/signals'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import type { VideoInfo } from '../appv'

export const video_player = //
  {
    player: signal<YouTubePlayer | null>(null),
    video_info: signal<VideoInfo | null>(null),
    current_time: signal<number>(0),
    is_playing: signal<boolean>(false),
    selected_word: signal<{ word: string; sentence: string } | null>(null),
  }
