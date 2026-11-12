/*********************************************************************************
 * 类型定义
 */

export type Subtitle = //
  {
    /** 序号 */
    index: string

    /** 开始时间 */
    start_time_str: string

    /** 结束时间 */
    end_time_str: string

    /** 开始时间(秒) */
    start_time: number

    /** 结束时间(秒) */
    end_time: number

    /** 内容 */
    text: string

    /** 单词列表 */
    words: string[]

    /** 翻译 */
    translation?: string
  }

export type VideoInfo = //
  {
    /** 视频ID */
    video_id: string

    /** 字幕 */
    srt: string

    /** 句子列表 */
    sentense_list: Subtitle[]

    /** 备注 */
    note: string

    /** 更新时间 */
    update_time: number
  }

export type AppData = //
  {
    /** 视频列表 */
    videos: VideoInfo[]

    /**
     * 单词统计
     *
     * 结构如下：
     * - key: 单词
     * - value: true表示已掌握，false表示未掌握
     */
    word_stat: Record<string, boolean>
  }

/*********************************************************************************
 * 错误类型
 */

export class InfoError extends Error
{
  constructor(message: string)
  {
    super(message)
    this.name = 'InfoError'
  }
}

export class LogicError extends Error
{
  constructor()
  {
    super('Logic Error')
    this.name = 'LogicError'
  }
}

/*********************************************************************************
 * 工具函数
 */

export function default_never(x: never): never
{
  return x as never
}

export async function saveTextFile(
  content: string,
  options: {
    suggestedName: string
    types?: FilePickerAcceptType[]
    mimeType?: string
  },
): Promise<void>
{
  if (typeof window.showSaveFilePicker === 'function')
  {
    try
    {
      const handle = await window.showSaveFilePicker({
        suggestedName: options.suggestedName,
        types: options.types,
      })
      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
      return
    }
    catch (err: unknown)
    {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.warn('showSaveFilePicker failed, falling back to download:', err)
    }
  }

  const mime = options.mimeType || 'application/json'
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = options.suggestedName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function openTextFile(
  options: {
    acceptInput: string
    types?: FilePickerAcceptType[]
  },
): Promise<string | null>
{
  if (typeof window.showOpenFilePicker === 'function')
  {
    try
    {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: options.types,
      })
      const file = await handle.getFile()
      return await file.text()
    }
    catch (err: unknown)
    {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      console.warn('showOpenFilePicker failed, falling back to file input:', err)
    }
  }

  return new Promise((resolve, reject) =>
  {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = options.acceptInput
    input.style.display = 'none'

    input.onchange = async () =>
    {
      const file = input.files?.[0]
      if (!file)
      {
        resolve(null)
        return
      }
      try
      {
        const text = await file.text()
        resolve(text)
      }
      catch (e)
      {
        reject(e)
      }
      finally
      {
        if (input.parentNode) input.parentNode.removeChild(input)
      }
    }

    input.oncancel = () =>
    {
      if (input.parentNode) input.parentNode.removeChild(input)
      resolve(null)
    }

    document.body.appendChild(input)
    input.click()
  })
}

