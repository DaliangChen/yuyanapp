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
  show_page: signal<'select_folder' | 'file_list' | 'video_player'>('select_folder'),

  /**
   * 当前打开的文件句柄
   */
  current_file_handle: signal<FileInfo | null>(null),

  /**
   * 选择的文件夹句柄
   */
  file_map: signal<{ [file_name: string]: FileInfo }>({}),
}
