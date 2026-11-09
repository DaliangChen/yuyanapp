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
    <div className='flex flex-wrap items-center justify-between px-5 py-3 bg-slate-950/95 border-t border-white/10 text-white z-20 gap-3 text-xs'>
      {/* Left controls */}
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={on_toggle_play}
          className='inline-flex items-center justify-center min-w-[76px] px-3 py-1.5 font-medium text-slate-100 bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors cursor-pointer'
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
                ? 'bg-sky-950 text-sky-300 border-sky-800'
                : 'bg-transparent text-slate-400 border-white/10 hover:text-slate-200'
            }`}
            title='开启后，全熟或生词占比低于阈值的字幕句会自动快进跳过'
          >
            ⏭ 自动跳过熟句：{isAutoSkip ? '开' : '关'}
          </button>

          {isAutoSkip && (
            <div className='flex items-center gap-1.5 text-slate-400' title='生词度低于此比例自动跳过 (默认 0.20 即 20%)'>
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
                className='w-14 px-1.5 py-1 text-xs bg-slate-900 border border-white/15 rounded text-slate-200 focus:outline-none focus:border-sky-400 text-center font-mono'
              />
            </div>
          )}
        </div>

        <span
          className='text-slate-400 max-w-[260px] truncate hidden md:inline-block'
          title={videoNote}
        >
          {videoNote}
        </span>
      </div>

      {/* Right navigation buttons */}
      <div className='flex items-center gap-2.5'>
        <button
          type='button'
          onClick={() =>
          {
            video_player.player.value?.pauseVideo()
            app.show_page.value = 'vocabulary'
          }}
          className='inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer'
        >
          <span>📖 生词本</span>
          <span className='px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono text-[11px]'>
            {totalWords}
          </span>
        </button>

        <button
          type='button'
          onClick={on_click_go_to_list}
          className='inline-flex items-center px-3 py-1.5 text-slate-400 hover:text-slate-200 bg-transparent hover:bg-white/5 border border-white/10 rounded-lg transition-colors cursor-pointer'
        >
          ← 返回列表
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
