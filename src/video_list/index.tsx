import { ActionPart } from './action'
import { AddPart } from './add'
import { TablePart } from './table'

export function VideoListPage()
{
  return (
    <div className='max-w-5xl mx-auto px-4 py-8 min-h-screen flex flex-col gap-6'>
      <ActionPart />
      <TablePart />
      <AddPart />
    </div>
  )
}
