import { ref, shallowRef as useRef, defineComponent } from 'vue'

export default defineComponent(() => {
  const count = ref(0)

  const buttonRef = useRef(null)
  setTimeout(() => {
    buttonRef.value.click()
  }, 1000)

  return () => (
    <>
      <button onClick={() => count.value++} ref={buttonRef}>
        +
      </button>
      <button onClick={() => count.value--}>-</button>

      <div>{count.value}</div>
    </>
  )
})
