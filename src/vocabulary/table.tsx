import * as app from '../appv'
import * as vocabulary from './value'

export function TablePart()
{
  const entries = vocabulary.paginated_entries.value

  if (entries.length === 0)
  {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--pico-muted-color)' }}>
        No words found
      </div>
    )
  }

  return (
    <table>
      <thead>
        <tr>
          <th scope='col'>Word</th>
          <th scope='col' style={{ width: '100px' }}>Passed</th>
          <th scope='col' style={{ width: '1%', whiteSpace: 'nowrap' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([word, is_passed]) => (
          <tr key={word}>
            <td scope='row'>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={is_passed ? { color: 'var(--pico-muted-color)' } : { fontWeight: 'bold' }}>{word}</span>
                <a href='#' onClick={() => on_pronounce(word)}>🔊</a>
              </span>
            </td>
            <td>
              <a href='#' onClick={() => on_toggle_pass(word)}>{is_passed ? 'Yes' : 'No'}</a>
            </td>
            <td>
              <span style={{ display: 'flex', gap: '10px' }}>
                <a href='#' onClick={() => on_delete(word)}>Delete</a>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function on_pronounce(word: string)
{
  if ('speechSynthesis' in window)
  {
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'de-DE'
    window.speechSynthesis.speak(u)
  }
}

function on_toggle_pass(word: string)
{
  const current = app.data.value.word_stat[word]
  const new_stat = { ...app.data.value.word_stat, [word]: !current }
  app.data.value = { ...app.data.value, word_stat: new_stat }
}

function on_delete(word: string)
{
  const new_stat = { ...app.data.value.word_stat }
  delete new_stat[word]
  app.data.value = { ...app.data.value, word_stat: new_stat }
}
