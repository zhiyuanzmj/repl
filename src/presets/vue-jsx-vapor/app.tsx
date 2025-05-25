import { ref, shallowRef as useRef } from 'vue'

export default () => {
  const count = ref(1)

  return (
    <>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value--}>-</button>

      <div v-for={index in count.value}>{index}</div>
    </>
  )
}
