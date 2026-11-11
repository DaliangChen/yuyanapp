export function PlayerPart()
{
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        #video_player, #video_player iframe {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
      `}</style>
      <div id='video_player' style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
