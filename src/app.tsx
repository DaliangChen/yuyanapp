import { useEffect } from 'preact/hooks'
import { app, InfoError, LogicError } from './appv'
import { VideoListPage } from './video_list'
import { VideoPlayerPage } from './video_player'
import { VocabularyPage } from './vocabulary'

export function App()
{
  useOnError()

  return (
    <div className='min-h-screen w-full bg-[#f8fafc] text-slate-800 antialiased selection:bg-slate-200'>
      {app.show_page.value === 'video_list' && <VideoListPage />}
      {app.show_page.value === 'video_player' && <VideoPlayerPage />}
      {app.show_page.value === 'vocabulary' && <VocabularyPage />}

      <ErrorInfo />
    </div>
  )
}

/*************************************************************************************
 * 错误提示组件：素雅模态框，替代原生 dialog 丑陋样式
 */

function ErrorInfo()
{
  if (!app.err_info.value) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs'>
      <div className='w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4'>
        <div className='flex items-center gap-2 text-rose-600 font-semibold text-base'>
          <span className='w-2 h-2 rounded-full bg-rose-500'></span>
          <span>提示信息</span>
        </div>
        <p className='text-sm text-slate-600 leading-relaxed break-words'>
          {app.err_info.value}
        </p>
        <div className='flex justify-end pt-2 border-t border-slate-100'>
          <button
            type='button'
            className='px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer'
            onClick={() => (app.err_info.value = null)}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
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
