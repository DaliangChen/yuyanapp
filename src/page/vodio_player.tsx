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
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            padding: 10,
          }}
        >
          <video
            src={url}
            ref={videoRef}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain', flex: 1 }}
          />
          <div style={{ width: '100%', height: 60 }}>
            控制区域
          </div>
        </div>
        <div style={{ width: 600 }}>
          123
        </div>
      </div>
    </>
  )
}
