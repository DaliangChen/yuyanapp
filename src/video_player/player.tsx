export function PlayerPart()
{
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
      <div style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <div id='video_player_div' style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
      </div>
    </div>
  )
}
