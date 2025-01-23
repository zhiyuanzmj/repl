import { defineComponent, ref, shallowRef as useRef } from 'vue'

export default defineComponent(() => {
  const count = ref(0)

  const buttonRef = useRef(null)
  setTimeout(() => {
    buttonRef.value && buttonRef.value.click()
  }, 1000)

  return () => (
    <>
      <button onClick={() => count.value++} ref={buttonRef}>
        +
      </button>
      <button onClick={() => count.value--}>-</button>

      <div v-if={count.value === 0}>eq {count.value}</div>
      <div v-else-if={count.value > 0}>lg {count.value}</div>
      <div v-else>lt {count.value}</div>
    </>
  )
})
