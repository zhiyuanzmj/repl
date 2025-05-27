export default defineVaporComponent(
  ({
    previewContainer = undefined as unknown as HTMLDivElement | null,
    theme = 'dark' as 'dark' | 'light',
  }) => {
    const useDevtoolsSrc = () => {
      const html = `
  <!DOCTYPE html>
  <html lang="en">
  <meta charset="utf-8">
  <title>DevTools</title>
  <meta name="referrer" content="no-referrer">
  <script type="module" src="https://cdn.jsdelivr.net/npm/chii@1.12.3/public/front_end/entrypoints/chii_app/chii_app.js"></script>
  <body class="undocked" id="-blink-dev-tools">`
      const devtoolsRawUrl = URL.createObjectURL(
        new Blob([html], { type: 'text/html' }),
      )
      return `${devtoolsRawUrl}#?embedded=${encodeURIComponent(location.origin)}`
    }

    let devtoolsIframe = $useRef()
    const devtoolsSrc = useDevtoolsSrc()

    window.addEventListener('message', (event) => {
      const Iframe = previewContainer?.firstChild as HTMLIFrameElement | undefined
      if (event.source === Iframe?.contentWindow) {
        devtoolsIframe?.contentWindow!.postMessage(event.data, '*')
      }
      if (event.source === devtoolsIframe?.contentWindow) {
        Iframe?.contentWindow!.postMessage(
          { event: 'DEV', data: event.data },
          '*',
        )
      }
    })

    watchEffect(() => {
      localStorage.setItem('uiTheme', theme === 'dark' ? '"dark"' : '"light"')
      devtoolsIframe?.contentWindow?.location.reload()
    })

    return (
      <div class="relative h-full">
        <iframe
          ref={(e) => (devtoolsIframe = e)}
          class="absolute inset-0 block h-full w-full border-none"
          src={devtoolsSrc}
          title="Devtools"
        />
      </div>
    )
  },
)
