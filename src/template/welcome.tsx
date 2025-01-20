import { ref } from 'vue'

export default () => {
  const count = ref(0)

  return (
    <>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value--}>-</button>
      <div>{count.value}</div>
    </>
  )
}
