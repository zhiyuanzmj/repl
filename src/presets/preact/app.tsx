import { useState } from 'preact/hooks'

export default () => {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>

      <div>{count}</div>
    </>
  )
}
