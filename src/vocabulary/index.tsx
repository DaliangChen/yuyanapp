import { ActionPart } from './action'
import { HeaderPart } from './header'
import { PagerPart } from './pager'
import { TablePart } from './table'

export function VocabularyPage()
{
  return (
    <div className='max-w-5xl mx-auto px-4 py-8 min-h-screen flex flex-col gap-6 text-slate-800'>
      {/* 顶部标题与统计概览 */}
      <HeaderPart />

      {/* 搜索与筛选排序工具栏 */}
      <ActionPart />

      {/* 单词列表与分页 */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden'>
        <TablePart />
        <PagerPart />
      </div>
    </div>
  )
}
