import { computed, signal } from '@preact/signals'
import { app } from '../appv'
import type { VideoInfo } from '../util'

/*******************************************************************************************
 * 用于添加或编辑视频的临时数据
 */

export const add_data = signal<{ video_info: VideoInfo; status: 'add' | 'edit' } | null>(null)

/*******************************************************************************************
 * 分页数据
 */
export const page_size = signal(15)
export const current_page = signal(1)
export const total_pages = computed(() => Math.ceil(app.data.value.videos.length / page_size.value))
