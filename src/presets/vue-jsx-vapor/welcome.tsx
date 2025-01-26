import { ref, shallowRef as useRef } from 'vue'

const If = (props: { count: number }) => {
  return (
    <fieldset>
      <legend>If</legend>
      <div v-if={props.count === 0}>eq {props.count}</div>
      <div v-else-if={props.count > 0}>lg {props.count}</div>
      <div v-else>lt {props.count}</div>
    </fieldset>
  )
}

const For = (props: { count: number }) => {
  return (
    <fieldset>
      <legend>For</legend>
      <div v-for={i in props.count}>{1}</div>
    </fieldset>
  )
}

const Slots = <T,>(props: { count: T }) => {
  const slots = defineSlots({
    default: (scope: { foo: T }) => <div>default</div>,
    title: () => <legend>Slots</legend>,
  })

  return (
    <fieldset>
      <slots.title />
      <slots.default foo={props.count} />
    </fieldset>
  )
}

const Expose = <T,>(props: { count: T }) => {
  const slots = defineSlots({
    default: (scope: { foo: T }) => <div>default</div>,
  })

  defineExpose(props)
  return (
    <fieldset>
      <legend>Expose</legend>
      <slots.default foo={props.count} />
    </fieldset>
  )
}

export default () => {
  const count = ref(0)

  const buttonRef = useRef()
  setTimeout(() => {
    buttonRef.value && buttonRef.value.click()
  }, 1000)

  const exposeRef = useRef()

  return (
    <>
      <button onClick={() => count.value++} ref={buttonRef}>
        +
      </button>
      <button onClick={() => count.value--}>-</button>

      <If count={count.value} />

      <For count={count.value} />

      <Slots count={count.value} v-slot={scope}>
        {scope.foo}
      </Slots>

      <Expose ref={exposeRef} count={count.value + ''}>
        {exposeRef.value?.count}
      </Expose>
    </>
  )
}
