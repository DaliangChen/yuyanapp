import { signal } from '@preact/signals'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import type { VideoInfo } from '../util';

export const video_player = //
  {
    player: signal<YouTubePlayer | null>(null),
    video_info: signal<VideoInfo | null>(null),
    current_time: signal<number>(0),
    is_playing: signal<boolean>(false),
    auto_skip_familiar: signal<boolean>(false),
    hud_message: signal<{ text: string; type: 'success' | 'fail' | 'skip' } | null>(null),
  }
