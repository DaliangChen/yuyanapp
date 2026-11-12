import { signal } from '@preact/signals'
import { type VideoInfo } from '../util'

export const edit_data = signal<VideoInfo | null>(null)
