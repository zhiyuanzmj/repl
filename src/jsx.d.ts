declare module 'vue' {
  interface HTMLAttributes {
    onVnodeMounted?: import('vue').VNodeProps['onVnodeMounted']
  }
  interface ReservedProps {
    onVnodeMounted?: import('vue').VNodeProps['onVnodeMounted']
  }
}

export {}
