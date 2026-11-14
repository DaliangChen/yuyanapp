import SrtParser from 'srt-parser-2'
import { InfoError } from '../util'
import * as srt_edit from './value'

export function ActionPart()
{
  return (
    <div style={{ display: 'flex', justifyContent: 'end' }}>
      <div role='group' style={{ display: 'flex', gap: '10px', width: 'fit-content' }}>
        <button className='outline' onClick={on_click_add_translation}>Add Translation</button>
      </div>
    </div>
  )
}

async function on_click_add_translation()
{
  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    types: [{ description: 'Srt', accept: { 'text/srt': ['.srt'] } }],
  })

  const file = await handle.getFile()
  const srt_text = await file.text()
  if (!srt_text) return

  let parser = new SrtParser()
  let srt_array = parser.fromSrt(srt_text)

  if (srt_array.length !== srt_edit.edit_data.value?.sentense_list.length)
  {
    throw new InfoError('Srt array length does not match')
  }

  let sentense_list = srt_edit.edit_data.value.sentense_list
  for (const [index, srt_item] of srt_array.entries())
  {
    if (srt_item.id !== sentense_list[index].index)
    {
      throw new InfoError('Srt item id does not match')
    }

    if (
      srt_item.endTime !== sentense_list[index].end_time_str
      || srt_item.startTime !== sentense_list[index].start_time_str
    )
    {
      throw new InfoError(`Srt item [${index}] time does not match`)
    }

    sentense_list[index].translation = srt_item.text
  }

  srt_edit.edit_data.value = { ...srt_edit.edit_data.value }
}
