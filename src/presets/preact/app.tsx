import { useState, useRef, useEffect } from 'preact/hooks'

export default () => {
  const [count, setCount] = useState(0)

  const buttonRef = useRef(null)
  useEffect(() => {
    setTimeout(() => {
      buttonRef.current.click()
    }, 1000)
  }, [])

  return (
    <>
      <button onClick={() => setCount(count + 1)} ref={buttonRef}>
        +
      </button>
      <button onClick={() => setCount(count - 1)}>-</button>

      <div>{count}</div>
    </>
  )
}
