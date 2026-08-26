'use client'
import { sx, sxClass } from '../../../lib/sx'
import { atoms } from '../../../styles/atoms.stylex'

import type { MapSlotProps } from '../../../host'
import { useHost, usePrintFallback } from '../../../host'

interface PlaceholderPoi {
  description?: string
  title?: string
}

function poiLabel(poi: unknown, index: number): string {
  const p = poi as PlaceholderPoi | null
  return p?.title || p?.description || `地点 ${index + 1}`
}

export function YohakuMapRenderer(props: MapSlotProps) {
  const { openLink, slots, webOrigin } = useHost()
  const printFallback = usePrintFallback('map', { title: props.title || '' })
  if (printFallback !== null) {
    return <p className="print-block-fallback">{printFallback}</p>
  }
  if (slots?.MapBlock) return <slots.MapBlock {...props} />

  const pois = props.pois ?? []

  return (
    <figure {...sxClass("not-prose", atoms.my_6, atoms.overflow_hidden, atoms.rounded_xl, atoms.bg____color_neutral_1, atoms.font_sans, atoms.ring_1, atoms.ring____color_neutral_3)}>
      <div {...sx(atoms.px_4, atoms.py_5)}>
        <div {...sx(atoms.flex, atoms.items_center, atoms.gap_2)}>
          <i {...sxClass("i-mingcute-map-pin-line", atoms.text____color_neutral_6)} />
          <span {...sx(atoms.text_copy_15, atoms.text____color_neutral_9)}>
            {props.title || '地图'}
          </span>
          <span {...sx(atoms.text_label_12, atoms.text____color_neutral_6)}>
            {pois.length} 个地点
          </span>
        </div>
        {pois.length > 0 ? (
          <ul {...sx(atoms.mt_3, atoms.flex, atoms.flex_col, atoms.gap_1dot5, atoms.p_0)}>
            {pois.slice(0, 6).map((poi, index) => (
              <li
                {...sx(atoms.text_label_12, atoms.flex, atoms.items_center, atoms.gap_2, atoms.text____color_neutral_8)}
                key={index}
              >
                <span {...sx(atoms.size_1, atoms.shrink_0, atoms.rounded_full, atoms.bg____color_neutral_5)} />
                <span {...sx(atoms.truncate)}>{poiLabel(poi, index)}</span>
              </li>
            ))}
            {pois.length > 6 ? (
              <li {...sx(atoms.text_label_12, atoms.text____color_neutral_6)}>
                +{pois.length - 6} 个地点
              </li>
            ) : null}
          </ul>
        ) : null}
        {webOrigin ? (
          <button
            {...sx(atoms.text_label_12, atoms.mt_3, atoms.rounded_lg, atoms.bg____color_neutral_3, atoms.px_3, atoms.py_1dot5, atoms.text____color_neutral_9)}
            type="button"
            onClick={() => void openLink(webOrigin)}
          >
            在网页中打开
          </button>
        ) : null}
      </div>
    </figure>
  )
}
