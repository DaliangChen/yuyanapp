import { useEffect } from 'preact/hooks'
import * as app from './appv'
import { InfoError, LogicError } from './util'
import { VideoListPage } from './video_list'
import { VideoPlayerPage } from './video_player'
import { VocabularyPage } from './vocabulary'

export function App()
{
  useOnError()

  return (
    <div style={{ padding: '0 100px' }}>
      <Nav />
      {app.show_page.value === 'video_list' && <VideoListPage />}
      {app.show_page.value === 'video_player' && <VideoPlayerPage />}
      {app.show_page.value === 'vocabulary' && <VocabularyPage />}
      <ErrorInfo />
    </div>
  )
}

function Nav()
{
  return (
    <nav style={{ borderBottom: '1px solid var(--pico-primary)', marginBottom: '20px' }}>
      <ul>
        <li>
          <h3 style={{ margin: '0' }}>YuYan</h3>
        </li>
      </ul>
      <ul>
        <li>
          <a href='#' onClick={() => app.show_page.value = 'video_list'}>Video List</a>
        </li>
        <li>
          <a href='#' onClick={() => app.show_page.value = 'video_player'}>Video Player</a>
        </li>
        <li>
          <a href='#' onClick={() => app.show_page.value = 'vocabulary'}>Vocabulary</a>
        </li>
      </ul>
    </nav>
  )
}

function ErrorInfo()
{
  if (!app.err_info.value) return null

  return (
    <dialog open={!!app.err_info.value}>
      <article>
        <h2>Error</h2>
        <p>{app.err_info.value}</p>
        <footer>
          <button className='outline' onClick={() => (app.err_info.value = null)}>Ok</button>
        </footer>
      </article>
    </dialog>
  )
}

function useOnError()
{
  useEffect(() =>
  {
    const handle_promise_rejection = (event: PromiseRejectionEvent) =>
    {
      if (event.reason instanceof InfoError || event.reason instanceof LogicError)
      {
        app.err_info.value = event.reason.message
        event.preventDefault()
        return
      }

      if (event.reason instanceof DOMException && event.reason.name === 'AbortError')
      {
        event.preventDefault()
        return
      }

      console.error(event)
      app.err_info.value = 'Unknown PromiseRejection: ' + event.reason
    }
    window.addEventListener('unhandledrejection', handle_promise_rejection)

    const handle_error = (event: ErrorEvent) =>
    {
      if (event.error instanceof InfoError || event.error instanceof LogicError)
      {
        app.err_info.value = event.error.message
        event.preventDefault()
        return
      }

      console.error(event)
      app.err_info.value = 'Unknown Error: ' + event.error.message
    }
    window.addEventListener('error', handle_error)

    return () =>
    {
      window.removeEventListener('unhandledrejection', handle_promise_rejection)
      window.removeEventListener('error', handle_error)
    }
  }, [])
}
