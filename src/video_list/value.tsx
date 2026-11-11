import { computed, signal } from '@preact/signals'
import { app } from '../appv'
import type { VideoInfo } from '../util'

/**
 * 用于添加或编辑视频的临时数据
 */
export const add_data = signal<{ video_info: VideoInfo; status: 'add' | 'edit' } | null>(null)

export const total_pages = computed(() => Math.ceil(app.data.value.videos.length / 15))

/**
 * 分页数据
 */
export const pager_info = signal(1)
