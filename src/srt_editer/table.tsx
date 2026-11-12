import * as srt_edit from './value'

export function TablePart()
{
  return (
    <div style={{ height: 'calc(100vh - 140px)', overflowY: 'scroll' }}>
      <table>
        <thead style={{ position: 'sticky', top: 0 }}>
          <tr>
            <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Index</th>
            <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Start Time</th>
            <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>End Time</th>
            <th scope='col'>Text</th>
          </tr>
        </thead>
        <tbody>
          {srt_edit.edit_data.value?.sentense_list.map((sentense) => (
            <tr key={sentense.index}>
              <td scope='row'>
                {sentense.index}
              </td>
              <td>
                {sentense.start_time_str}
              </td>
              <td>
                {sentense.end_time_str}
              </td>
              <td>
                {sentense.text}
                <br />
                <span style={{ fontSize: '0.8em', color: 'var(--pico-secondary)' }}>
                  {sentense.words.join(' ')} (WORDS)
                </span>
                <br />
                <span style={{ fontSize: '0.8em' }}>
                  {sentense.translation} (TRANSLATION)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
