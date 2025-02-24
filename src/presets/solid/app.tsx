import { createSignal } from 'solid-js'

export default () => {
  const [count, setCount] = createSignal(0)

  let buttonRef = null
  setTimeout(() => {
    buttonRef.click()
  }, 1000)

  return (
    <>
      <button onClick={() => setCount(count() + 1)} ref={buttonRef}>
        +
      </button>
      <button onClick={() => setCount(count() - 1)}>-</button>

      <div>{count()}</div>
    </>
  )
}
