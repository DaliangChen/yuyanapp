import { useEffect, useMemo, useRef } from 'preact/hooks'
import { video_player } from './value'

interface SubtitleItem
{
  start: number
  end: number
  text: string
}

function parseSRT(srt: string): SubtitleItem[]
{
  const pattern = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*\n([\s\S]*?)(?=\n\s*\n|$)/g
  const results: SubtitleItem[] = []
  let match: RegExpMatchArray

  const timeToSeconds = (timeStr: string) =>
  {
    const [h, m, sMs] = timeStr.replace(',', '.').split(':')
    const [s, ms] = sMs.split('.')
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms || '0') / 1000
  }

  while ((match = pattern.exec(srt)) !== null)
  {
    results.push({
      start: timeToSeconds(match[1]),
      end: timeToSeconds(match[2]),
      text: match[3].replace(/<[^>]+>/g, '').trim(),
    })
  }
  return results
}

export function SrtPart()
{
  const activeRef = useRef<HTMLDivElement>(null)

  const subtitles = useMemo(() =>
  {
    return parseSRT(video_player.video_info.value.srt_1 ?? '')
  }, [video_player.video_info.value])

  const activeIndex = subtitles.findIndex(
    sub => video_player.current_time.value >= sub.start && video_player.current_time.value <= sub.end,
  )

  useEffect(() =>
  {
    if (activeRef.current)
    {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeIndex])

  return (
    <div
      style={{
        gridArea: 'sidebar',
        height: '100%',
        overflow: 'hidden',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', borderRadius: '10px' }}>
        {subtitles.map((sub, index) =>
        {
          const isActive = index === activeIndex
          return (
            <div
              key={index}
              ref={isActive ? activeRef : null}
              onClick={() => video_player.player.value?.seekTo(sub.start, true)}
              style={{
                userSelect: 'none',
                padding: '8px 12px',
                margin: '4px 0',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: isActive ? '#3399ff' : 'transparent',
                color: isActive ? '#fff' : '#aaa',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {sub.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}
