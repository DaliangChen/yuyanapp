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
  const isAutoSkip = video_player.auto_skip_familiar.value
  const threshold = video_player.skip_threshold.value

  return (
    <div className='flex flex-wrap items-center justify-between px-4 py-3 bg-white border-t border-slate-200 gap-3 text-xs'>
      {/* Play/Pause & Auto-skip */}
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={on_toggle_play}
          className='inline-flex items-center justify-center min-w-[76px] px-3.5 py-1.5 font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer'
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>

        {/* Auto-skip mastered sentences toggle */}
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => (video_player.auto_skip_familiar.value = !video_player.auto_skip_familiar.value)}
            className={`inline-flex items-center px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isAutoSkip
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title='开启后，全熟或生词占比低于阈值的字幕句会自动快进跳过'
          >
            ⏭ 自动跳过熟句：{isAutoSkip ? '已开启' : '已关闭'}
          </button>

          {isAutoSkip && (
            <div className='flex items-center gap-1.5 text-slate-500' title='生词度低于此比例自动跳过 (默认 0.20 即 20%)'>
              <span>跳过阈值:</span>
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
                className='w-14 px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-slate-400 text-center font-mono'
              />
            </div>
          )}
        </div>
      </div>

      {/* Helpful shortcuts hint */}
      <div className='hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono'>
        <span>滚轮后勾 / → : 下一句</span>
        <span>·</span>
        <span>滚轮前推 / ← : 上一句重播</span>
        <span>·</span>
        <span>空格 : 播放/暂停</span>
      </div>
    </div>
  )
}
