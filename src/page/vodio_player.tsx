import { useEffect } from 'preact/hooks'
import { useState } from 'preact/hooks'
import { useRef } from 'preact/hooks'
import appv from '../appv'

export function VideoPlayerPage()
{
  const [url, set_url] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() =>
  {
    const file_info = appv.current_file_handle.value
    if (file_info === null) return

    let objectUrl = ''
    file_info.handle.getFile().then((file) =>
    {
      const blob = new Blob([file], { type: 'video/mp4' })
      objectUrl = URL.createObjectURL(blob)
      set_url(objectUrl)
    })

    return () =>
    {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [appv.current_file_handle.value])

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateAreas: `
                            "video sidebar"
                            "control sidebar"
                            `,
          gridTemplateColumns: '1fr 600px',
          gridTemplateRows: '1fr 60px',
          width: '100%',
          height: '100%',
        }}
      >
        <div
          style={{
            gridArea: 'video',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
          }}
        >
          <video
            controls
            src={url}
            ref={videoRef}
            style={{ width: '100%', objectFit: 'contain', borderRadius: '10px' }}
          />
        </div>

        <div style={{ gridArea: 'control' }}>
          控制区域
        </div>

        <div style={{ gridArea: 'sidebar', height: '100%' }}>
          右侧合并的长面板 (123)
        </div>
      </div>
    </>
  )
}
