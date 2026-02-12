import { toPng } from 'html-to-image'
import { ref } from 'vue'

export function useScreenshot() {
  const error = ref<string | null>()

  async function capture(el: HTMLElement) {
    const fileName = `vue-flow-screenshot-${Date.now()}`

    // HACK force edges to have a black stroke, otherwise they are excluded from the image
    for (const edgePath of el.querySelectorAll('svg path.vue-flow__edge-path')) {
      edgePath.setAttribute('stroke', 'black')
      edgePath.setAttribute('stroke-width', '2px')
      edgePath.setAttribute('fill', 'none')
    }

    let data: string | null = null
    error.value = null
    try {
      data = await toPng(el, {
        quality: 1,
        skipFonts: true,
        backgroundColor: 'white',
        style: {
          borderWidth: '0',
        },
        filter(node) {
          return !node.classList || !node.classList.contains('vue-flow__panel')
        },
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      console.error(e)
      return null
    }

    if (!data) return null

    // immediately download the image if shouldDownload is true
    const link = document.createElement('a')
    link.download = `${fileName}.png`
    link.href = data
    link.click()
  }

  return {
    capture,
    error,
  }
}
