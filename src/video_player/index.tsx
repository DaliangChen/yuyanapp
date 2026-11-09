import { useEffect, useRef } from 'preact/hooks'
import YouTubePlayer from 'youtube-player'
import { app } from '../appv'
import { video_list } from '../video_list/value'
import { ControlPart } from './control'
import { PlayerPart } from './player'
import { calculateSentenceWeight, parseSRT, SrtPart } from './srt'
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0f1d',
        overflow: 'hidden',
      }}
    >
      {/* Video stage with overlaid 3-sentence subtitle box & HUD */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
        }}
      >
        <PlayerPart />

        {/* HUD Notification Toast */}
        {hud && (
          <div
            style={{
              position: 'absolute',
              top: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              padding: '10px 22px',
              borderRadius: '24px',
              backgroundColor: hud.type === 'success'
                ? 'rgba(22, 101, 52, 0.92)'
                : hud.type === 'fail'
                ? 'rgba(185, 28, 28, 0.92)'
                : 'rgba(30, 58, 138, 0.92)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {hud.text}
          </div>
        )}

        <SrtPart />
      </div>

      {/* Clean bottom controls */}
      <ControlPart />
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

                // Find next non-skipped subtitle
                let targetIdx = activeIdx + 1
                while (targetIdx < subs.length)
                {
                  const nextWeight = calculateSentenceWeight(subs[targetIdx].text, video_list.data.value.word_stat)
                  if (nextWeight >= video_player.skip_threshold.value) break
                  targetIdx++
                }

                if (targetIdx < subs.length)
                {
                  showHud(`⏭ 自动跳过熟句 (生词度 ${(weight * 100).toFixed(0)}%)`, 'skip')
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

function useKeyboardShortcuts()
{
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

      // Extract all words from current sentence
      const rawWords = (currSub?.text || '').toLowerCase().match(/[a-z0-9'-]+/g) || []
      const words = rawWords.map(w => w.replace(/^'+|'+$/g, '')).filter(Boolean)

      // 按 → (右箭头)：当前句所有单词 success + 1，跳到下一句播放
      if (e.code === 'ArrowRight')
      {
        e.preventDefault()
        const wordStat = video_list.data.value.word_stat || {}

        for (const w of words)
        {
          const stat = wordStat[w] || { success: 0, fail: 0 }
          stat.success = (stat.success || 0) + 1
          wordStat[w] = stat
        }

        video_list.data.value.word_stat = wordStat
        video_list.data.value = { ...video_list.data.value }

        showHud(`✓ 已掌握当前句 (${words.length}词 Success+1) → 播放下一句`, 'success')

        // Jump to next sentence
        if (currIdx + 1 < subs.length)
        {
          video_player.player.value?.seekTo(subs[currIdx + 1].start, true)
        }
      }
      // 按 ← (左箭头)：当前句所有单词 fail + 1，重播上一句
      else if (e.code === 'ArrowLeft')
      {
        e.preventDefault()
        const wordStat = video_list.data.value.word_stat || {}

        for (const w of words)
        {
          const stat = wordStat[w] || { success: 0, fail: 0 }
          stat.fail = (stat.fail || 0) + 1
          wordStat[w] = stat
        }

        video_list.data.value.word_stat = wordStat
        video_list.data.value = { ...video_list.data.value }

        showHud(`⭐ 记为生词 (${words.length}词 Fail+1) ← 重播上一句`, 'fail')

        // Jump to previous sentence (or beginning of current sentence if first)
        if (currIdx > 0)
        {
          video_player.player.value?.seekTo(subs[currIdx - 1].start, true)
        }
        else if (currSub)
        {
          video_player.player.value?.seekTo(currSub.start, true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
