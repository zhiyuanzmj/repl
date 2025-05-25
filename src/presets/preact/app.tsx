import { useState } from 'preact/hooks'

export default () => {
  const [count, setCount] = useState(1)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>

      <div>{count}</div>
    </>
  )
}
