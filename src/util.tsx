/*********************************************************************************
 * 类型定义
 */

export type VideoInfo = //
  {
    /** 视频ID */
    video_id: string

    /** 第一语种字幕 */
    srt_1: string

    /** 第二语种字幕 */
    srt_2: string

    /** 备注 */
    note: string

    /** 更新时间 */
    update_time: number
  }

export type AppData = //
  {
    /** 视频列表 */
    videos: VideoInfo[]

    /** 单词统计 */
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
