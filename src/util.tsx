/*********************************************************************************
 * 类型定义
 */

export type Sentense = //
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
    sentense_list: Sentense[]

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
