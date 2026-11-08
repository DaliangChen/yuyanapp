import { useEffect } from 'preact/hooks'
import { useState } from 'preact/hooks'
import { useRef } from 'react'
import appv from '../appv'

export function VideoPlayerPage()
{
  const [url, set_url] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() =>
  {
    const file_info = appv.current_file_handle.value
    if (file_info === null) return

    file_info.handle.getFile().then((file) =>
    {
      const blob = new Blob([file], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      set_url(url)
    })

    return () =>
    {
      URL.revokeObjectURL(url)
    }
  }, [appv.current_file_handle.value])

  return (
    <>
      <video src={url} ref={videoRef} controls></video>
    </>
  )
}
