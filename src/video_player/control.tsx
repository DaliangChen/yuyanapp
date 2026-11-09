import { app } from '../appv'
import { video_list } from '../video_list/value'
import { video_player } from './value'

const on_toggle_play = () =>
{
  if (video_player.is_playing.value) {
    video_player.player.value?.pauseVideo()
  } else {
    video_player.player.value?.playVideo()
  }
}

export function ControlPart()
{
  const isPlaying = video_player.is_playing.value
  const videoNote = video_player.video_info.value?.note || video_player.video_info.value?.video_id || ''
  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value
  const totalWords = Object.keys(video_list.data.value.word_stat || {}).length

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        zIndex: 20,
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          className='outline'
          style={{
            minWidth: '95px',
            margin: 0,
            borderColor: '#38bdf8',
            color: '#38bdf8',
            padding: '6px 14px',
          }}
          onClick={on_toggle_play}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>

        {/* Auto-skip mastered sentences toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={isAutoSkip ? '' : 'outline secondary'}
            style={{
              margin: 0,
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: isAutoSkip ? '#0284c7' : 'transparent',
              borderColor: isAutoSkip ? '#0284c7' : '#475569',
              color: isAutoSkip ? '#ffffff' : '#94a3b8',
            }}
            title='开启后，全熟或生词占比低于阈值的字幕句会自动快进跳过'
            onClick={() => (video_player.auto_skip_familiar.value = !video_player.auto_skip_familiar.value)}
          >
            ⏭ 自动跳过熟句：{isAutoSkip ? '已开启' : '已关闭'}
          </button>

          {isAutoSkip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8' }}>
              <span>阈值:</span>
              <input
                type='number'
                min='0'
                max='1'
                step='0.05'
                value={threshold}
                onChange={(e) =>
                {
                  const val = parseFloat(e.currentTarget.value)
                  if (!isNaN(val)) video_player.skip_threshold.value = Math.max(0, Math.min(1, val))
                }}
                style={{
                  width: '64px',
                  margin: 0,
                  padding: '2px 6px',
                  fontSize: '12px',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                }}
                title='生词权重低于此比例即判定为熟句跳过 (默认 0.20，即 20%)'
              />
            </div>
          )}
        </div>

        <span
          style={{
            fontSize: '13px',
            color: '#94a3b8',
            maxWidth: '320px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={videoNote}
        >
          {videoNote}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          className='outline secondary'
          style={{ margin: 0, padding: '6px 12px', fontSize: '13px', color: '#38bdf8', borderColor: '#0284c7' }}
          onClick={() =>
          {
            video_player.player.value?.pauseVideo()
            app.show_page.value = 'vocabulary'
          }}
        >
          📖 生词本 ({totalWords})
        </button>

        <button
          className='outline secondary'
          style={{ margin: 0, padding: '6px 14px', color: '#cbd5e1', borderColor: '#475569' }}
          onClick={on_click_go_to_list}
        >
          ← 返回视频列表
        </button>
      </div>
    </div>
  )
}

function on_click_go_to_list()
{
  video_player.player.value?.pauseVideo()
  app.show_page.value = 'video_list'
}
