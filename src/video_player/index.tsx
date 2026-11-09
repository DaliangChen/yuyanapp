import { useEffect, useRef } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import { app } from '../appv'
import { video_list } from '../video_list/value'
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
  const totalWords = Object.keys(video_list.data.value.word_stat || {}).length
  const videoNote = video_player.video_info.value?.note || video_player.video_info.value?.video_id || ''

  const onBack = () =>
  {
    video_player.player.value?.pauseVideo()
    app.show_page.value = 'video_list'
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-6 sm:py-8 min-h-screen flex flex-col gap-4 text-slate-800'>
      {/* Top Header - 与列表页和生词本完全统一的素雅头部 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200'>
        <div>
          <button
            type='button'
            onClick={onBack}
            className='inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer'
          >
            ← 返回视频列表
          </button>
          <div className='flex items-center gap-2.5'>
            <h1 className='text-lg font-semibold tracking-tight text-slate-900 truncate max-w-md' title={videoNote}>
              {videoNote}
            </h1>
            <code className='text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded'>
              {video_player.video_info.value.video_id}
            </code>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() =>
            {
              video_player.player.value?.pauseVideo()
              app.show_page.value = 'vocabulary'
            }}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer'
          >
            <span>📖 生词本</span>
            <span className='px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]'>
              {totalWords}
            </span>
          </button>
        </div>
      </div>

      {/* Main Video & Subtitle Card - 素雅大卡片 */}
      <div className='bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col'>
        {/* Video Stage with Overlaid 3-Sentence Subtitles */}
        <div className='relative w-full aspect-video min-h-[380px] sm:min-h-[480px] max-h-[72vh] bg-black flex items-center justify-center overflow-hidden'>
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

          {/* 3-Sentence Subtitle Overlay */}
          <SrtPart />
        </div>

        {/* Bottom Control Bar */}
        <ControlPart />
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
              const weight = calculateSentenceWeight(activeSub.text, video_list.data.value.word_stat)
              if (weight < video_player.skip_threshold.value)
              {
                lastSkippedStartRef.current = activeSub.start

                // 寻找下一个未被跳过的句子
                const targetIdx = findNextPlayableIndex(
                  subs,
                  activeIdx,
                  true,
                  video_player.skip_threshold.value,
                  video_list.data.value.word_stat,
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
      }
      catch
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
 * 右箭头 (或手指向后勾滚轮)：
 * 判定当前句掌握，当前句所有单词 success + 1，跳到下一个实际播放的句子
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
  const currSub = subs[currIdx]
  const words = extractWords(currSub?.text || '')
  const wordStat = video_list.data.value.word_stat || {}

  for (const w of words)
  {
    const stat = wordStat[w] || { success: 0, fail: 0 }
    stat.success = (stat.success || 0) + 1
    wordStat[w] = stat
  }

  video_list.data.value.word_stat = wordStat
  video_list.data.value = { ...video_list.data.value }

  showHud(`✓ 已掌握当前句 (${words.length} 词 Success+1) → 下一句`, 'success')

  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value
  const targetNextIdx = findNextPlayableIndex(subs, currIdx, isAutoSkip, threshold, wordStat)

  if (targetNextIdx !== -1)
  {
    video_player.player.value?.seekTo(subs[targetNextIdx].start, true)
  }
}

/**
 * 左箭头 (或手指向前推滚轮) - 方案 B：
 * 判定上一句（刚刚播放完的那一句，在跳过模式下为前一个未被跳过、实际播放的句子）没听懂：
 * 对该“刚刚播放完的上一句”的所有单词 fail + 1，并倒回到该句开头重播！
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

  const wordStat = video_list.data.value.word_stat || {}
  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value

  // 寻找“刚刚实际播放完的上一句”
  // 如果开启了跳过模式，向前回溯找出上一个未被跳过、刚刚播过的句子
  const targetPrevIdx = findPrevPlayableIndex(subs, currIdx, isAutoSkip, threshold, wordStat)

  // 如果存在可倒退的上一句
  if (targetPrevIdx !== -1 && targetPrevIdx < currIdx)
  {
    const prevSub = subs[targetPrevIdx]
    const words = extractWords(prevSub.text)

    for (const w of words)
    {
      const stat = wordStat[w] || { success: 0, fail: 0 }
      stat.fail = (stat.fail || 0) + 1
      wordStat[w] = stat
    }

    video_list.data.value.word_stat = wordStat
    video_list.data.value = { ...video_list.data.value }

    showHud(`⭐ 记为生词 (上一句 ${words.length} 词 Fail+1) ← 倒回重播`, 'fail')
    video_player.player.value?.seekTo(prevSub.start, true)
  }
  else
  {
    // 如果已经在最开始（没有上一句可倒退），则针对第 0 句记生词并重播
    const firstSub = subs[0]
    const words = extractWords(firstSub.text)

    for (const w of words)
    {
      const stat = wordStat[w] || { success: 0, fail: 0 }
      stat.fail = (stat.fail || 0) + 1
      wordStat[w] = stat
    }

    video_list.data.value.word_stat = wordStat
    video_list.data.value = { ...video_list.data.value }

    showHud(`⭐ 记为生词 (起始句 ${words.length} 词 Fail+1) ← 重播`, 'fail')
    video_player.player.value?.seekTo(firstSub.start, true)
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
        }
        else
        {
          video_player.player.value?.playVideo()
        }
        return
      }

      // 按 → (右箭头)：当前句所有单词 success + 1，跳到下一个实际播放句子
      if (e.code === 'ArrowRight')
      {
        e.preventDefault()
        handleRightArrowAction()
      }
      // 按 ← (左箭头) [方案 B]：刚刚播放完的上一句 fail + 1，倒回该句重播
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

      const now = Date.now()
      // 防抖冷却：每次滚轮动作间隔 320ms，避免连发跳帧
      if (now - lastWheelTimeRef.current < 320) return
      if (Math.abs(e.deltaY) < 10) return

      // 手指向后勾 / 滚轮向后滚 (deltaY > 0)：相当于按右箭头 (当前句掌握，跳下一句)
      if (e.deltaY > 0)
      {
        lastWheelTimeRef.current = now
        handleRightArrowAction()
      }
      // 手指向前推 / 滚轮向前滚 (deltaY < 0)：相当于按左箭头 (上一句记生词，倒回重播)
      else if (e.deltaY < 0)
      {
        lastWheelTimeRef.current = now
        handleLeftArrowAction()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: true })

    return () =>
    {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])
}
