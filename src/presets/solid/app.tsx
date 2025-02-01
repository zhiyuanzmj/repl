import { createSignal } from 'solid-js'

const useRef = <T,>(value: T) => value

export default () => {
  const [count, setCount] = createSignal(0)

  let buttonRef = useRef(null)
  setTimeout(() => {
    buttonRef && buttonRef.click()
  }, 1000)

  return (
    <>
      <button onClick={() => setCount(count() + 1)} ref={buttonRef}>
        +
      </button>
      <button onClick={() => setCount(count() - 1)}>-</button>

      <div v-if={count() === 0}>eq {count()}</div>
      <div v-else-if={count() > 0}>lg {count()}</div>
      <div v-else>lt {count()}</div>
    </>
  )
}
