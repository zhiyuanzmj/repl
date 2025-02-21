import {
  defineConfig,
  presetAttributify,
  presetUno,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'border-base': 'border-$border',
    'border-bg-base': 'border-$bg',
    bg: 'bg-$bg',
    text: 'text-$text',
  },
  content: {
    pipeline: {
      include: [/\.(vue|tsx?|html)($|\?)/],
    },
  },
  presets: [presetUno(), presetAttributify(), presetIcons()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
})
