import { signal } from '@preact/signals'
import type { PageInfo, VideoInfo } from '../util'

/**
 * 用于添加或编辑视频的临时数据
 */
export const add_data = signal<{ video_info: VideoInfo; status: 'add' | 'edit' } | null>(null)

/**
 * 分页数据
 */
export const pager_info = signal<PageInfo>({ current_page: 1, total_pages: 1 })
