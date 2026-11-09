import { effect, signal } from '@preact/signals'
import { InfoError, type VideoInfo } from '../appv'

export const video_list = //
  {
    data_file_handle: signal<FileSystemFileHandle | null>(null),

    data: signal<{
      videos: VideoInfo[]
      word_stat: Record<string, { success: number; fail: number }>
    }>({
      videos: [],
      word_stat: {},
    }),

    add_data: signal<VideoInfo | null>(null),
  }

effect(() =>
{
  const data = video_list.data.value
  const handle = video_list.data_file_handle.peek()

  if (!handle) return

  handle.createWritable()
    .then(async writable =>
    {
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()
    })
    .catch((e: Error) =>
    {
      throw new InfoError(e.message)
    })
})
