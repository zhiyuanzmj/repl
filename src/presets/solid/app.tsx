import { createSignal } from 'solid-js'

export default () => {
  const [count, setCount] = createSignal(0)

  return (
    <>
      <button onClick={() => setCount(count() + 1)}>+</button>
      <button onClick={() => setCount(count() - 1)}>-</button>

      <div>{count()}</div>
    </>
  )
}
