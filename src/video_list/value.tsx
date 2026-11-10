import { signal } from '@preact/signals'
import type { VideoInfo } from '../util'

export const video_list = //
  {
    add_data: signal<{ video_info: VideoInfo; status: 'add' | 'edit' } | null>(null),
  }
