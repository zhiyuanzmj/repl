import { useState, useRef, useEffect } from 'react'

export default () => {
  const [count, setCount] = useState(0)

  const buttonRef = useRef(null)
  useEffect(() => {
    setTimeout(() => {
      buttonRef.current && buttonRef.current.click()
    }, 1000)
  }, [])

  return (
    <>
      <button onClick={() => setCount(count + 1)} ref={buttonRef}>
        +
      </button>
      <button onClick={() => setCount(count - 1)}>-</button>

      <div v-if={count === 0}>eq {count}</div>
      <div v-else-if={count > 0}>lg {count}</div>
      <div v-else>lt {count}</div>
    </>
  )
}
