import { useEffect, useRef } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import { app } from '../appv'
import { ActionPart } from './action'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import {
  calculateSentenceWeight,
  extractWords,
  findNextPlayableIndex,
  findPrevPlayableIndex,
  parseSRT,
  SrtPart,
} from './srt'
import { video_player } from './value'

export function VideoPlayerPage()
{
  useInit()
  useKeyboardShortcuts()

  if (!video_player.video_info.value)
  {
    app.show_page.value = 'video_list'
    return null
  }

  const hud = video_player.hud_message.value

  return (
    <div className='max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3 max-h-[920px] flex flex-col justify-start gap-2.5 text-slate-800 overflow-hidden'>
      {/* Top Header - 与列表页和生词本完全统一的素雅头部 */}
      <ActionPart />

      {/* Main Video & Subtitle Card - 素雅大卡片 */}
      <div className='bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col'>
        {/* Video Stage without overlaid subtitle obstruction */}
        <div className='relative w-full aspect-video max-h-[46vh] sm:max-h-[50vh] md:max-h-[460px] bg-black flex items-center justify-center overflow-hidden shrink-0'>
          <PlayerPart />

          {/* HUD Toast - 素雅白底微阴影悬浮胶囊 */}
          {hud && (
            <div
              className={`absolute top-5 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full text-xs font-medium shadow-md border backdrop-blur-md transition-all duration-200 flex items-center gap-2 pointer-events-none ${
                hud.type === 'success'
                  ? 'bg-white/95 text-emerald-800 border-emerald-300'
                  : hud.type === 'fail'
                  ? 'bg-white/95 text-amber-800 border-amber-300'
                  : 'bg-white/95 text-sky-800 border-sky-300'
              }`}
            >
              {hud.text}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <ControlPart />

        {/* Subtitles placed below the control bar with larger typography */}
        <SrtPart />
      </div>
    </div>
  )
}

function showHud(text: string, type: 'success' | 'fail' | 'skip')
{
  video_player.hud_message.value = { text, type }
  setTimeout(() =>
  {
    if (video_player.hud_message.value?.text === text)
    {
      video_player.hud_message.value = null
    }
  }, 1400)
}

function useInit()
{
  const lastSkippedStartRef = useRef<number | null>(null)

  useEffect(() =>
  {
    const videoId = video_player.video_info.value?.video_id
    const player = YouTubePlayer('video_player', {
      playerVars: {
        autoplay: 0,
        rel: 0,
      },
    })
    video_player.player.value = player

    if (videoId)
    {
      player.loadVideoById(videoId)
    }

    // Listen to player state changes
    // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
    player.on('stateChange', (event: { data: number }) =>
    {
      video_player.is_playing.value = event.data === 1
    })

    const interval_id = setInterval(async () =>
    {
      try
      {
        const time = (await video_player.player.value?.getCurrentTime()) ?? 0
        video_player.current_time.value = time

        // Auto-skip familiar sentence logic
        if (video_player.auto_skip_familiar.value && video_player.is_playing.value)
        {
          const subs = parseSRT(video_player.video_info.value?.srt_1 ?? '')
          const activeIdx = subs.findIndex(s => time >= s.start && time <= s.end)

          if (activeIdx !== -1)
          {
            const activeSub = subs[activeIdx]
            if (lastSkippedStartRef.current !== activeSub.start)
            {
              const weight = calculateSentenceWeight(activeSub.text, app.data.value.word_stat)
              if (weight < video_player.skip_threshold.value)
              {
                lastSkippedStartRef.current = activeSub.start

                // 寻找下一个未被跳过的句子
                const targetIdx = findNextPlayableIndex(
                  subs,
                  activeIdx,
                  true,
                  video_player.skip_threshold.value,
                  app.data.value.word_stat,
                )

                if (targetIdx !== -1)
                {
                  showHud(`⏭ 跳过熟句 (生词度 ${(weight * 100).toFixed(0)}%)`, 'skip')
                  video_player.player.value?.seekTo(subs[targetIdx].start, true)
                }
              }
            }
          }
        }
      } catch
      {
        // Ignore during player destroy/transition
      }
    }, 100)

    return () =>
    {
      video_player.player.value?.destroy()
      video_player.player.value = null
      video_player.is_playing.value = false
      clearInterval(interval_id)
    }
  }, [])
}

/**
 * 右箭头：
 * 纯字幕跳转到下一个实际播放的句子（无单词频次统计）
 */
function handleRightArrowAction()
{
  const srt1 = video_player.video_info.value?.srt_1 ?? ''
  const subs = parseSRT(srt1)
  if (subs.length === 0) return

  const currentTime = video_player.current_time.value
  let currIdx = subs.findIndex(s => currentTime >= s.start && currentTime <= s.end)
  if (currIdx === -1)
  {
    const nextIdx = subs.findIndex(s => s.start > currentTime)
    currIdx = nextIdx !== -1 ? nextIdx : subs.length - 1
  }

  const wordStat = app.data.value.word_stat || {}
  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value
  const targetNextIdx = findNextPlayableIndex(subs, currIdx, isAutoSkip, threshold, wordStat)

  if (targetNextIdx !== -1)
  {
    showHud('下一句 →', 'success')
    video_player.player.value?.seekTo(subs[targetNextIdx].start, true)
  }
}

/**
 * 左箭头：
 * 纯字幕倒回到上一个实际播放的句子重播（无单词频次统计）
 */
function handleLeftArrowAction()
{
  const srt1 = video_player.video_info.value?.srt_1 ?? ''
  const subs = parseSRT(srt1)
  if (subs.length === 0) return

  const currentTime = video_player.current_time.value
  let currIdx = subs.findIndex(s => currentTime >= s.start && currentTime <= s.end)
  if (currIdx === -1)
  {
    const nextIdx = subs.findIndex(s => s.start > currentTime)
    currIdx = nextIdx !== -1 ? nextIdx : subs.length - 1
  }

  const wordStat = app.data.value.word_stat || {}
  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value

  // 寻找“刚刚实际播放完的上一句”
  const targetPrevIdx = findPrevPlayableIndex(subs, currIdx, isAutoSkip, threshold, wordStat)

  if (targetPrevIdx !== -1 && targetPrevIdx < currIdx)
  {
    const prevSub = subs[targetPrevIdx]
    showHud('← 上一句 (重播)', 'fail')
    video_player.player.value?.seekTo(prevSub.start, true)
  } else
  {
    const firstSub = subs[0]
    showHud('← 起始句 (重播)', 'fail')
    video_player.player.value?.seekTo(firstSub.start, true)
  }
}

/**
 * 滚轮向后滚 / 手指向后勾 (deltaY > 0)：
 * 只打分不跳转：当前句所有单词 success + 1
 */
function handleWheelNextAction()
{
  const srt1 = video_player.video_info.value?.srt_1 ?? ''
  const subs = parseSRT(srt1)
  if (subs.length === 0) return

  const currentTime = video_player.current_time.value
  let currIdx = subs.findIndex(s => currentTime >= s.start && currentTime <= s.end)
  if (currIdx === -1)
  {
    const nextIdx = subs.findIndex(s => s.start > currentTime)
    currIdx = nextIdx !== -1 ? nextIdx : subs.length - 1
  }

  const currSub = subs[currIdx]
  const words = extractWords(currSub?.text || '')
  const wordStat = app.data.value.word_stat || {}

  for (const w of words)
  {
    wordStat[w] = true
  }

  app.data.value = {
    ...app.data.value,
    word_stat: { ...wordStat },
  }

  showHud(`✓ 已掌握当前句 (${words.length} 词 Pass)`, 'success')
}

/**
 * 滚轮向前推 / 手指向前推 (deltaY < 0)：
 * 只打分不跳转：上一句（刚刚播放完的句子）所有单词标记为生词 (false)
 */
function handleWheelPrevAction()
{
  const srt1 = video_player.video_info.value?.srt_1 ?? ''
  const subs = parseSRT(srt1)
  if (subs.length === 0) return

  const currentTime = video_player.current_time.value
  let currIdx = subs.findIndex(s => currentTime >= s.start && currentTime <= s.end)
  if (currIdx === -1)
  {
    const nextIdx = subs.findIndex(s => s.start > currentTime)
    currIdx = nextIdx !== -1 ? nextIdx : subs.length - 1
  }

  const wordStat = app.data.value.word_stat || {}
  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value

  const targetPrevIdx = findPrevPlayableIndex(subs, currIdx, isAutoSkip, threshold, wordStat)

  if (targetPrevIdx !== -1 && targetPrevIdx < currIdx)
  {
    const prevSub = subs[targetPrevIdx]
    const words = extractWords(prevSub.text)

    for (const w of words)
    {
      wordStat[w] = false
    }

    app.data.value = {
      ...app.data.value,
      word_stat: { ...wordStat },
    }

    showHud(`⭐ 记为生词 (上一句 ${words.length} 词)`, 'fail')
  } else
  {
    const firstSub = subs[0]
    const words = extractWords(firstSub.text)

    for (const w of words)
    {
      wordStat[w] = false
    }

    app.data.value = {
      ...app.data.value,
      word_stat: { ...wordStat },
    }

    showHud(`⭐ 记为生词 (起始句 ${words.length} 词)`, 'fail')
  }
}

function useKeyboardShortcuts()
{
  const lastWheelTimeRef = useRef<number>(0)

  useEffect(() =>
  {
    const handleKeyDown = async (e: KeyboardEvent) =>
    {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (e.code === 'Space')
      {
        e.preventDefault()
        if (video_player.is_playing.value)
        {
          video_player.player.value?.pauseVideo()
        } else
        {
          video_player.player.value?.playVideo()
        }
        return
      }

      // 按 → (右箭头)：纯字幕跳转下一句（不计频次）
      if (e.code === 'ArrowRight')
      {
        e.preventDefault()
        handleRightArrowAction()
      } // 按 ← (左箭头)：纯字幕倒回上一句重播（不计频次）
      else if (e.code === 'ArrowLeft')
      {
        e.preventDefault()
        handleLeftArrowAction()
      }
    }

    const handleWheel = (e: WheelEvent) =>
    {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      // 阻止页面跟随滚动晃动
      e.preventDefault()

      const now = Date.now()
      // 防抖冷却：每次滚轮动作间隔 320ms，避免连发跳帧
      if (now - lastWheelTimeRef.current < 320) return
      if (Math.abs(e.deltaY) < 10) return

      // 手指向后勾 / 滚轮向后滚 (deltaY > 0)：当前句掌握 (success+1)，只打分不跳转
      if (e.deltaY > 0)
      {
        lastWheelTimeRef.current = now
        handleWheelNextAction()
      } // 手指向前推 / 滚轮向前滚 (deltaY < 0)：上一句记生词 (fail+1)，只打分不跳转
      else if (e.deltaY < 0)
      {
        lastWheelTimeRef.current = now
        handleWheelPrevAction()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () =>
    {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])
}
