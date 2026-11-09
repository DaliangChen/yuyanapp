import { signal } from '@preact/signals'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import type { FileInfo } from '../appv'

export const video_player = //
  {
    player: signal<YouTubePlayer | null>(null),
    file_info: signal<FileInfo | null>(null),
  }
