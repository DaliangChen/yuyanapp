import { signal } from '@preact/signals'
import { type FileInfo } from '../appv'

export const video_list = //
  {
    data_file_handle: signal<FileSystemFileHandle | null>(null),

    data: signal<{
      videos: FileInfo[]
      word_stat: Record<string, { success: number; fail: number }>
    }>({
      videos: [],
      word_stat: {},
    }),

    add_data: signal<
      {
        video_id: string
        srt: string
        note: string
      } | null
    >(null),
  }
