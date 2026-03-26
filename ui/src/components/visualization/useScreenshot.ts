import { toPng } from 'html-to-image'
import { ref } from 'vue'

// SVG presentation attributes that can also be set via CSS.
// html-to-image may fail to resolve CSS variables on some browsers (e.g. Edge/Windows),
// so we inline the computed values as direct SVG attributes before capture.
const SVG_PRESENTATION_ATTRS: Array<[keyof CSSStyleDeclaration, string]> = [
  ['fill', 'fill'],
  ['fillOpacity', 'fill-opacity'],
  ['fillRule', 'fill-rule'],
  ['stroke', 'stroke'],
  ['strokeWidth', 'stroke-width'],
  ['strokeDasharray', 'stroke-dasharray'],
  ['strokeDashoffset', 'stroke-dashoffset'],
  ['strokeLinecap', 'stroke-linecap'],
  ['strokeLinejoin', 'stroke-linejoin'],
  ['strokeMiterlimit', 'stroke-miterlimit'],
  ['strokeOpacity', 'stroke-opacity'],
  ['opacity', 'opacity'],
  ['color', 'color'],
  ['fontSize', 'font-size'],
  ['fontFamily', 'font-family'],
  ['fontWeight', 'font-weight'],
  ['fontStyle', 'font-style'],
  ['textAnchor', 'text-anchor'],
  ['dominantBaseline', 'dominant-baseline'],
  ['visibility', 'visibility'],
]

type AttrBackup = { el: SVGElement; attr: string; prev: string | null }[]

function inlineSvgPresentationAttrs(el: HTMLElement): AttrBackup {
  const backup: AttrBackup = []
  for (const svgEl of el.querySelectorAll<SVGElement>('svg, svg *')) {
    const computed = getComputedStyle(svgEl)
    for (const [cssProp, svgAttr] of SVG_PRESENTATION_ATTRS) {
      const value = computed[cssProp] as string
      if (value) {
        backup.push({ el: svgEl, attr: svgAttr, prev: svgEl.getAttribute(svgAttr) })
        svgEl.setAttribute(svgAttr, value)
      }
    }
  }
  return backup
}

function restoreSvgPresentationAttrs(backup: AttrBackup) {
  for (const { el, attr, prev } of backup) {
    if (prev === null) el.removeAttribute(attr)
    else el.setAttribute(attr, prev)
  }
}

export function useScreenshot() {
  const error = ref<string | null>()

  async function capture(el: HTMLElement, fileName?: string) {
    const resolvedFileName = fileName || `chart-export-${Date.now()}`

    // Inline computed SVG presentation attribute values so CSS variables are
    // resolved even in browsers where html-to-image cannot read them (e.g. Edge
    // on Windows). Back up original values and restore afterwards.
    const backup = inlineSvgPresentationAttrs(el)

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
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      console.error(e)
    } finally {
      restoreSvgPresentationAttrs(backup)
    }

    if (!data) return null

    // immediately download the image if shouldDownload is true
    const link = document.createElement('a')
    link.download = `${resolvedFileName}.png`
    link.href = data
    link.click()
  }

  return {
    capture,
    error,
  }
}
