import appv from '../appv'

export function FileList()
{
  return (
    <>
      <table>
        <thead>
          <tr>
            <th scope='col'>文件名</th>
            <th scope='col'>操作</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(appv.file_map.value).map(([name, handle]) =>
          {
            return (
              <tr key={name}>
                <th scope='row'>{name}</th>
                <td><a>打开</a></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
