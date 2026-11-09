import { ActionPart } from './action'
import { AddPart } from './add'
import { TablePart } from './table'

export function VideoListPage()
{
  return (
    <div style={{ height: '100%', padding: '10px' }}>
      <ActionPart />
      <TablePart />
      <AddPart />
    </div>
  )
}
