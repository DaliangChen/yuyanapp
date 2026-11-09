export function PlayerPart()
{
  return (
    <div
      style={{
        gridArea: 'video',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
      }}
    >
      <div id='video_player' style={{ width: '100%', borderRadius: '10px' }} />
    </div>
  )
}
