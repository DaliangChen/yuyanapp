export function VideoPlayerPage()
{
  // useEffect(() =>
  // {
  //   appv.video_player.value = YouTubePlayer('player-1', { playerVars: { autoplay: 1 } })
  //   appv.video_player.value.loadVideoById('d1nIWPQ9yek').then(() =>
  //   {
  //     console.log('video loaded')
  //     appv.video_player.value?.playVideo()
  //   })
  //   return () =>
  //   {
  //     appv.video_player.value?.destroy()
  //     appv.video_player.value = null
  //   }
  // }, [])

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
          <div id='player-1' style={{ width: '100%', borderRadius: '10px' }} />
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
