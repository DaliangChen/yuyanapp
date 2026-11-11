import { useEffect } from 'preact/hooks'
import { app } from './appv'
import { InfoError, LogicError } from './util'
import { VideoListPage } from './video_list'
import { VideoPlayerPage } from './video_player'
import { VocabularyPage } from './vocabulary'

export function App()
{
  useOnError()

  return (
    <>
      <nav>
        <ul>
          <li>
            <strong>Acme Corp</strong>
          </li>
        </ul>
        <ul>
          <li>
            <a href='#'>About</a>
          </li>
          <li>
            <a href='#'>Services</a>
          </li>
          <li>
            <a href='#'>Products</a>
          </li>
        </ul>
      </nav>
      {app.show_page.value === 'video_list' && <VideoListPage />}
      {app.show_page.value === 'video_player' && <VideoPlayerPage />}
      {app.show_page.value === 'vocabulary' && <VocabularyPage />}
      <ErrorInfo />
    </>
  )
}

/*************************************************************************************
 * 错误提示组件：素雅模态框，替代原生 dialog 丑陋样式
 */

function ErrorInfo()
{
  if (!app.err_info.value) return null

  return (
    <dialog open={!!app.err_info.value}>
      <article>
        <h2>提示信息</h2>
        <p>{app.err_info.value}</p>
        <footer>
          <button onClick={() => (app.err_info.value = null)}>确定</button>
        </footer>
      </article>
    </dialog>
  )
}

/*************************************************************************************
 * 全局错误处理，包括 Promise 错误、Error 错误
 */

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
