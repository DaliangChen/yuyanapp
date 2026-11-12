import { ActionPart } from './action'
import { TablePart } from './table'
import * as srt_edit from './value'

export function SrtEditerPage()
{
  if (srt_edit.edit_data.value === null)
  {
    return <div style={{ textAlign: 'center' }}>Select video to edit</div>
  }

  return (
    <>
      <ActionPart />
      <TablePart />
    </>
  )
}
