import { app } from '../appv'
import { vocabulary } from './value'

export function TablePart()
{
  const entries = vocabulary.paginated_entries.value

  if (entries.length === 0)
  {
    return (
      <div className='flex flex-col items-center justify-center p-14 text-center'>
        <div className='text-2xl mb-2 text-slate-300'>📖</div>
        <p className='text-sm font-medium text-slate-700'>没有匹配的生词</p>
        <p className='text-xs text-slate-400 mt-1 max-w-sm'>
          在视频播放中按 ←（左箭头）或向前滚动鼠标滚轮，即可整句加入生词本。
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-left text-xs'>
        <thead className='bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200'>
          <tr>
            <th scope='col' className='py-3 px-4 w-[220px]'>单词 (Word)</th>
            <th scope='col' className='py-3 px-4 w-[130px]'>已掌握 (Pass)</th>
            <th scope='col' className='py-3 px-4 w-[110px]'>熟练度 (Success)</th>
            <th scope='col' className='py-3 px-4 w-[110px]'>生词标记 (Fail)</th>
            <th scope='col' className='py-3 px-4 w-[100px]'>总打卡</th>
            <th scope='col' className='py-3 px-4'>掌握程度</th>
            <th scope='col' className='py-3 px-4 w-[70px] text-right'>操作</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100 text-slate-700'>
          {entries.map(([word, stat]) =>
          {
            const total = (stat.success || 0) + (stat.fail || 0)
            const rate = total > 0 ? Math.round((stat.success / total) * 100) : 0
            const isPassed = !!stat.pass

            return (
              <tr
                key={word}
                className={`hover:bg-slate-50/60 transition-colors ${isPassed ? 'bg-slate-50/40 text-slate-400' : ''}`}
              >
                <td className='py-3 px-4'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`font-medium text-sm ${
                        isPassed
                          ? 'text-slate-400 line-through decoration-slate-300'
                          : stat.fail >= 3
                          ? 'text-amber-800 font-semibold'
                          : 'text-slate-900'
                      }`}
                    >
                      {word}
                    </span>
                    <button
                      type='button'
                      onClick={() => pronounce(word)}
                      className='text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs p-0.5'
                      title='发音'
                    >
                      🔊
                    </button>
                  </div>
                </td>
                <td className='py-3 px-4'>
                  <button
                    type='button'
                    onClick={() => vocabulary.togglePass(word)}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      isPassed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isPassed ? '✓ 已掌握' : '未标记'}
                  </button>
                </td>
                <td className='py-3 px-4 text-emerald-600 font-medium font-mono'>
                  {stat.success || 0}
                </td>
                <td className='py-3 px-4 font-mono'>
                  <span className={stat.fail > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'}>
                    {stat.fail || 0}
                  </span>
                </td>
                <td className='py-3 px-4 text-slate-400 font-mono text-[11px]'>
                  {total} 次
                </td>
                <td className='py-3 px-4'>
                  <div className='flex items-center gap-2 max-w-[160px]'>
                    <div className='flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPassed
                            ? 'bg-emerald-500'
                            : rate >= 70
                            ? 'bg-emerald-400'
                            : rate >= 40
                            ? 'bg-sky-400'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${isPassed ? 100 : rate}%` }}
                      />
                    </div>
                    <span className='text-[11px] text-slate-400 font-mono w-9 text-right'>
                      {isPassed ? '100%' : `${rate}%`}
                    </span>
                  </div>
                </td>
                <td className='py-3 px-4 text-right'>
                  <button
                    type='button'
                    onClick={() => delete_word(word)}
                    className='text-slate-400 hover:text-rose-600 transition-colors cursor-pointer text-xs'
                    title='从生词本中移除'
                  >
                    删除
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function pronounce(word: string)
{
  if ('speechSynthesis' in window)
  {
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'de-DE'
    window.speechSynthesis.speak(u)
  }
}

function delete_word(word: string)
{
  const newWordStat = { ...app.data.value.word_stat }
  delete newWordStat[word]
  app.data.value = {
    ...app.data.value,
    word_stat: newWordStat,
  }
}
