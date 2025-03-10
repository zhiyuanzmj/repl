import { ref, shallowRef as useRef } from 'vue'

export default () => {
  const count = ref(0)

  const buttonRef = useRef()
  setTimeout(() => {
    buttonRef.value.click()
  }, 1000)

  return (
    <>
      <button onClick={() => count.value++} ref={buttonRef}>
        +
      </button>
      <button onClick={() => count.value--}>-</button>

      <div v-for={index in count.value}>{index}</div>
    </>
  )
}
