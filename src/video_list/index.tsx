import { PagerPart } from '../component/pager'
import { ActionPart } from './action'
import { AddPart } from './add'
import { TablePart } from './table'
import * as video_list from './value'

export function VideoListPage()
{
  return (
    <div>
      <ActionPart />
      <TablePart />
      <PagerPart page_info={video_list.pager_info} />
      <AddPart />
    </div>
  )
}
