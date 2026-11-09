import { signal } from '@preact/signals'
import type { YouTubePlayer } from 'youtube-player/dist/types'

export type FileInfo = {
  handle: FileSystemFileHandle
  has_srt: boolean
  has_mp4: boolean
}

const app = //
  {
    show_page: signal<'video_list' | 'video_player'>('video_list'),
  }

const video_list = //
  {
    async on_click_create_data()
    {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'data.json',
        types: [
          {
            description: 'JSON',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      })

      const writable = await handle.createWritable()
      await writable.write(JSON.stringify({}))
      await writable.close()
    },

    async on_click_upload_data()
    {},

    async on_click_add_video()
    {},
  }

const video_player = //
  {
    player: signal<YouTubePlayer | null>(null),
    file_info: signal<FileInfo | null>(null),
  }

export default //
{
  app,
  video_list,
  video_player,
}
