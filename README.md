# jsx-repl

JSX REPL, support Vite plugins and Volar plugins.

## Basic Usage

**Note: `jsx-repl` supports Monaco Editor, but also requires explicitly passing in the editor to be used for tree-shaking.**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
export default defineConfig({
  optimizeDeps: {
    exclude: ['jsx-repl'],
  },
  // ...
})
```

### With CodeMirror Editor

Basic editing experience with no intellisense. Lighter weight, fewer network requests, better for embedding use cases.

```vue
<script setup>
import { Repl } from 'jsx-repl'
import CodeMirror from 'jsx-repl/codemirror-editor'
</script>

<template>
  <Repl :editor="CodeMirror" />
</template>
```

### With Monaco Editor

With Volar support, autocomplete, type inference, and semantic highlighting. Heavier bundle, loads dts files from CDN, better for standalone use cases.

```vue
<script setup>
import { Repl } from 'jsx-repl'
import Monaco from 'jsx-repl/monaco-editor'
</script>

<template>
  <Repl :editor="Monaco" />
</template>
```
