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

  return (
    <div className='flex flex-wrap items-center justify-between px-3.5 py-2 bg-white border-t border-slate-200 gap-2.5 text-xs'>
      {/* Play/Pause & Auto-skip */}
      <div className='flex items-center gap-2.5'>
        <button
          type='button'
          onClick={on_toggle_play}
          className='inline-flex items-center justify-center min-w-[72px] px-3 py-1 font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-xs'
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>

        {/* Auto-skip mastered sentences toggle */}
        <button
          type='button'
          onClick={() => (video_player.auto_skip_familiar.value = !video_player.auto_skip_familiar.value)}
          className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            isAutoSkip
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title='开启后，所有单词均已掌握的句子会自动快进跳过'
        >
          ⏭ 自动跳过熟句：{isAutoSkip ? '已开启' : '已关闭'}
        </button>
      </div>

      {/* Helpful shortcuts hint */}
      <div className='hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono'>
        <span>滚轮向后: 掌握 (Pass)</span>
        <span>·</span>
        <span>滚轮向前: 生词</span>
        <span>·</span>
        <span>←/→: 跳转</span>
        <span>·</span>
        <span>空格: 播放/暂停</span>
      </div>
    </div>
  )
}
