import { PagerPart } from '../component/pager'
import { ActionPart } from './action'
import { TablePart } from './table'
import * as vocabulary from './value'

export function VocabularyPage()
{
  return (
    <div>
      <ActionPart />
      <TablePart />
      <PagerPart current_page={vocabulary.current_page} total_pages={vocabulary.total_pages} />
    </div>
  )
}
