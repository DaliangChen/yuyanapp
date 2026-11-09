import { useMemo, useState } from 'preact/hooks'
import { app } from '../appv'
import { video_list } from '../video_list/value'

type FilterType = 'all' | 'need_review' | 'passed'
type SortType = 'fail_desc' | 'success_desc' | 'alpha'

export function VocabularyPage()
{
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('fail_desc')

  const wordStats = video_list.data.value.word_stat || {}
  const allEntries = Object.entries(wordStats)

  const totalWords = allEntries.length
  const passedWords = allEntries.filter(([, s]) => s.pass).length
  const needReviewWords = allEntries.filter(([, s]) => !s.pass && s.fail > 0).length

  const filteredEntries = useMemo(() =>
  {
    let list = allEntries

    if (search.trim())
    {
      const q = search.trim().toLowerCase()
      list = list.filter(([w]) => w.includes(q))
    }

    if (filter === 'passed')
    {
      list = list.filter(([, s]) => s.pass)
    }
    else if (filter === 'need_review')
    {
      list = list.filter(([, s]) => !s.pass && s.fail > 0)
    }

    list = [...list].sort(([wA, sA], [wB, sB]) =>
    {
      if (sort === 'fail_desc') return sB.fail - sA.fail || (sB.success + sB.fail) - (sA.success + sA.fail)
      if (sort === 'success_desc') return sB.success - sA.success || sB.fail - sA.fail
      return wA.localeCompare(wB)
    })

    return list
  }, [allEntries, search, filter, sort])

  const pronounce = (word: string) =>
  {
    if ('speechSynthesis' in window)
    {
      const u = new SpeechSynthesisUtterance(word)
      u.lang = 'en-US'
      window.speechSynthesis.speak(u)
    }
  }

  const togglePass = (word: string) =>
  {
    const stat = wordStats[word]
    if (stat)
    {
      stat.pass = !stat.pass
      video_list.data.value = { ...video_list.data.value }
    }
  }

  const deleteWord = (word: string) =>
  {
    delete video_list.data.value.word_stat[word]
    video_list.data.value = { ...video_list.data.value }
  }

  const onBack = () =>
  {
    app.show_page.value = 'video_list'
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button
            className='outline secondary'
            style={{ marginBottom: '10px', padding: '5px 12px', fontSize: '13px' }}
            onClick={onBack}
          >
            ← 返回视频列表
          </button>
          <h2 style={{ margin: 0 }}>📖 生词本 (Vocabulary)</h2>
        </div>

        {/* Quick stats badges */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '8px 16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>总单词数</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{totalWords}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '12px', color: '#166534' }}>已掌握 (Pass)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#15803d' }}>{passedWords}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '12px', color: '#991b1b' }}>待攻克生词</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#b91c1c' }}>{needReviewWords}</div>
          </div>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
          <input
            type='search'
            placeholder='🔍 搜索生词或单词...'
            value={search}
            onInput={(e) => setSearch(e.currentTarget.value)}
            style={{ margin: 0, maxWidth: '320px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={filter === 'all' ? '' : 'outline secondary'}
              style={{ margin: 0, padding: '5px 12px', fontSize: '13px' }}
              onClick={() => setFilter('all')}
            >
              全部 ({totalWords})
            </button>
            <button
              className={filter === 'need_review' ? '' : 'outline secondary'}
              style={{ margin: 0, padding: '5px 12px', fontSize: '13px' }}
              onClick={() => setFilter('need_review')}
            >
              待复习 ({needReviewWords})
            </button>
            <button
              className={filter === 'passed' ? '' : 'outline secondary'}
              style={{ margin: 0, padding: '5px 12px', fontSize: '13px' }}
              onClick={() => setFilter('passed')}
            >
              已掌握 ({passedWords})
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.currentTarget.value as SortType)}
            style={{ margin: 0, width: 'auto', fontSize: '13px', padding: '5px 10px' }}
          >
            <option value='fail_desc'>按生词次数 (Fail) 降序</option>
            <option value='success_desc'>按掌握次数 (Success) 降序</option>
            <option value='alpha'>按字母顺序 (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Words Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <p style={{ fontSize: '16px' }}>没有匹配的单词</p>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              在播放视频时，按键盘 ←（左箭头）或 →（右箭头）可以整句记词，或点击字幕中的单词进行标记！
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: '220px' }}>单词 (Word)</th>
                <th style={{ width: '150px' }}>已掌握 (Pass)</th>
                <th style={{ width: '120px' }}>熟练度 (Success)</th>
                <th style={{ width: '120px' }}>生词标记 (Fail)</th>
                <th style={{ width: '120px' }}>总打卡次数</th>
                <th style={{ width: '180px' }}>掌握程度</th>
                <th style={{ width: '100px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(([word, stat]) =>
              {
                const total = (stat.success || 0) + (stat.fail || 0)
                const rate = total > 0 ? Math.round((stat.success / total) * 100) : 0
                const isPassed = !!stat.pass

                return (
                  <tr key={word} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isPassed ? '#f8fafc' : '#ffffff' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: isPassed ? '#64748b' : stat.fail > 2 ? '#b91c1c' : '#0f172a',
                          }}
                        >
                          {word}
                        </span>
                        <button
                          className='outline secondary'
                          style={{ margin: 0, padding: '1px 6px', fontSize: '11px' }}
                          title='发音'
                          onClick={() => pronounce(word)}
                        >
                          🔊
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className={isPassed ? '' : 'outline secondary'}
                        style={{
                          margin: 0,
                          padding: '3px 10px',
                          fontSize: '12px',
                          backgroundColor: isPassed ? '#16a34a' : 'transparent',
                          borderColor: isPassed ? '#16a34a' : '#cbd5e1',
                          color: isPassed ? '#ffffff' : '#64748b',
                        }}
                        onClick={() => togglePass(word)}
                      >
                        {isPassed ? '✓ 已掌握 (Pass)' : '未标记'}
                      </button>
                    </td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{stat.success || 0}</td>
                    <td style={{ color: stat.fail > 0 ? '#dc2626' : '#64748b', fontWeight: stat.fail > 0 ? 600 : 400 }}>
                      {stat.fail || 0}
                    </td>
                    <td style={{ color: '#64748b' }}>{total} 次</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '7px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${isPassed ? 100 : rate}%`,
                              height: '100%',
                              backgroundColor: isPassed ? '#16a34a' : rate >= 70 ? '#22c55e' : rate >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b', width: '38px', textAlign: 'right' }}>
                          {isPassed ? '100%' : `${rate}%`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <a
                        href='#'
                        style={{ color: '#94a3b8', fontSize: '13px' }}
                        onClick={(e) =>
                        {
                          e.preventDefault()
                          deleteWord(word)
                        }}
                      >
                        删除
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
