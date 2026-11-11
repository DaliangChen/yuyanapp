import { useEffect, useRef } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import * as app from '../appv'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { extractWords, findNextPlayableIndex, findPrevPlayableIndex, isSentencePassed, parseSRT, SrtPart } from './srt'
import * as video_player from './value'

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '920px',
        margin: '0 auto',
      }}
    >
      {/* Video Stage without overlaid subtitle obstruction */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          maxHeight: '480px',
          backgroundColor: '#000000',
          borderRadius: 'var(--pico-border-radius)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlayerPart />

        {/* HUD Toast */}
        {hud && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              pointerEvents: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            {hud.text}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <ControlPart />

      {/* Subtitles Area */}
      <SrtPart />
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

  // 单词不在单词表中时，自动补充到单词本中作为不 pass (false)
  useEffect(() =>
  {
    const srt1 = video_player.video_info.value?.srt_1 ?? ''
    if (!srt1) return

    const subs = parseSRT(srt1)
    let hasNew = false
    const currentStat = { ...app.data.value.word_stat }

    for (const s of subs)
    {
      const words = extractWords(s.text)
      for (const w of words)
      {
        if (currentStat[w] === undefined)
        {
          currentStat[w] = false
          hasNew = true
        }
      }
    }

    if (hasNew)
    {
      app.data.value = {
        ...app.data.value,
        word_stat: currentStat,
      }
    }
  }, [video_player.video_info.value?.video_id, video_player.video_info.value?.srt_1])

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

        // 自动跳过熟句：如果句子所有单词都 pass，自动跳过
        if (video_player.auto_skip_familiar.value && video_player.is_playing.value)
        {
          const subs = parseSRT(video_player.video_info.value?.srt_1 ?? '')
          const activeIdx = subs.findIndex(s => time >= s.start && time <= s.end)

          if (activeIdx !== -1)
          {
            const activeSub = subs[activeIdx]
            if (lastSkippedStartRef.current !== activeSub.start)
            {
              const isPassed = isSentencePassed(activeSub.text, app.data.value.word_stat)
              if (isPassed)
              {
                lastSkippedStartRef.current = activeSub.start

                // 寻找下一个未 pass 的句子
                const targetIdx = findNextPlayableIndex(
                  subs,
                  activeIdx,
                  true,
                  app.data.value.word_stat,
                )

                if (targetIdx !== -1)
                {
                  showHud('⏭ 自动跳过已掌握句子', 'skip')
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
  const targetNextIdx = findNextPlayableIndex(subs, currIdx, isAutoSkip, wordStat)

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

  // 寻找“刚刚实际播放完的上一句”
  const targetPrevIdx = findPrevPlayableIndex(subs, currIdx, isAutoSkip, wordStat)

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

  const targetPrevIdx = findPrevPlayableIndex(subs, currIdx, isAutoSkip, wordStat)

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
