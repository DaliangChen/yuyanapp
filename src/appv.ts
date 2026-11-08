import { computed, signal } from '@preact/signals'

/************************************************************************
 * 显示页面
 */
const show_page_index = signal<'select_folder' | 'file_list'>('select_folder')

/************************************************************************/

/**
 * 选择的文件夹句柄
 */
const file_map = signal<{ [file_name: string]: FileSystemFileHandle }>({})

export default //
{
  file_map,
  show_page_index,
}
