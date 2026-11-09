import { signal } from '@preact/signals'
import { type FileInfo, InfoError } from '../appv'

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

    async on_click_create_data()
    {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'yuyan_data.json',
        types: [
          {
            description: 'Json',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      })

      video_list.data_file_handle.value = handle

      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(video_list.data.value, null, 2))
      await writable.close()
    },

    async on_click_upload_data()
    {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Json',
          accept: {
            'application/json': ['.json'],
          },
        }],
        multiple: false,
      })

      video_list.data_file_handle.value = handle

      const file = await handle.getFile()
      const text = await file.text()
      video_list.data.value = JSON.parse(text)

      if (!video_list.data.value.videos) video_list.data.value.videos = []
      if (!video_list.data.value.word_stat) video_list.data.value.word_stat = {}
    },

    async on_click_add_video()
    {
      if (!video_list.data_file_handle.value) throw new InfoError('Please create or upload data file first.')
    },
  }
