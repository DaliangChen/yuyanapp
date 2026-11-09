import { signal } from '@preact/signals'

export type FileInfo = {
  handle: FileSystemFileHandle
  has_srt: boolean
  has_mp4: boolean
}

export default //
{
  /**  
   * 显示页面
   */
  show_page: signal<'video_list' | 'video_player'>('video_list'),
}
