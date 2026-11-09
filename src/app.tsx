import { useEffect } from 'preact/hooks'
import { app, InfoError } from './appv'
import { VideoListPage } from './page/video_list'
import { VideoPlayerPage } from './page/vodio_player'

export function App()
{
  useOnError()

  return (
    <>
      {app.show_page.value === 'video_list' && <VideoListPage />}
      {app.show_page.value === 'video_player' && <VideoPlayerPage />}

      <ErrorInfo />
    </>
  )
}

/*************************************************************************************
 * 错误提示组件，可以被全局错误处理使用，也可以被其他组件手动触发
 */

function ErrorInfo()
{
  return (
    <dialog open={app.err_info.value !== null}>
      <article>
        <header>
          <p>
            <strong>Error</strong>
          </p>
        </header>
        <p>
          {app.err_info.value}
        </p>
        <footer>
          <button className='outline' onClick={() => app.err_info.value = null}>
            Confirm
          </button>
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
      if (event.reason instanceof InfoError)
      {
        app.err_info.value = event.reason.message
        event.preventDefault()
        return
      }

      console.log(event)
      app.err_info.value = 'Unknown PromiseRejection: ' + event.reason
    }

    window.addEventListener('unhandledrejection', handle_promise_rejection)

    const handle_error = (event: ErrorEvent) =>
    {
      if (event.error instanceof InfoError)
      {
        app.err_info.value = event.error.message
        event.preventDefault()
        return
      }

      console.log(event)
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
