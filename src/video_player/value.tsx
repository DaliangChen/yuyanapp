import { signal } from '@preact/signals'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import type { VideoInfo } from '../appv'

export type SubtitleMode = 'bilingual' | 'srt_1' | 'srt_2'

export const video_player = //
  {
    player: signal<YouTubePlayer | null>(null),
    video_info: signal<VideoInfo | null>(null),
    current_time: signal<number>(0),
    is_playing: signal<boolean>(false),
    playback_rate: signal<number>(1),
    loop_current_sentence: signal<boolean>(false),
    subtitle_mode: signal<SubtitleMode>('bilingual'),
    selected_word: signal<{ word: string; sentence: string } | null>(null),
  }
