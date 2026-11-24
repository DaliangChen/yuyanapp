import { computed, signal } from '@preact/signals'
import SrtParser from 'srt-parser-2'
import * as app from '../appv'
import type { VideoInfo } from '../util'

/*******************************************************************************************
 * 分页数据
 */

export const page_size = signal(10)
export const current_page = signal(1)
export const total_pages = computed(() => Math.ceil(app.data.value.videos.length / page_size.value))

/*******************************************************************************************
 * 添加 srt 文件到视频中
 */

export async function add_srt_by_handle(handle: FileSystemFileHandle, video: VideoInfo)
{
  const file = await handle.getFile()
  const srt_text = await file.text()
  if (!srt_text) return

  let parser = new SrtParser()
  let srt_array = parser.fromSrt(srt_text)
  const segmenter = new Intl.Segmenter('de-DE', { granularity: 'word' })

  video.sentense_list = srt_array.map(it =>
  {
    const segments = Array.from(segmenter.segment(it.text))
    const words = segments
      .filter(item => item.isWordLike)
      .map(item => item.segment)

    words.forEach(word =>
    {
      if (!(word in app.data.value.word_stat))
      {
        app.data.value.word_stat[word] = false
      }
    })

    return {
      start_time_str: it.startTime,
      end_time_str: it.endTime,
      start_time: it.startSeconds,
      end_time: it.endSeconds,
      text: it.text,
      index: it.id,
      words: words,
    }
  })

  video.srt = srt_text
  video.update_time = Date.now()
  app.data.value = { ...app.data.value }
}
