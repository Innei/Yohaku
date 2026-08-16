'use client'

import type { MapSlotProps } from '../../../host'
import { useHost } from '../../../host'

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
  if (slots?.MapBlock) return <slots.MapBlock {...props} />

  const pois = props.pois ?? []

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl bg-(--color-neutral-1) font-sans ring-1 ring-(--color-neutral-3)">
      <div className="px-4 py-5">
        <div className="flex items-center gap-2">
          <i className="i-mingcute-map-pin-line text-(--color-neutral-6)" />
          <span className="text-copy-15 text-(--color-neutral-9)">
            {props.title || '地图'}
          </span>
          <span className="text-label-12 text-(--color-neutral-6)">
            {pois.length} 个地点
          </span>
        </div>
        {pois.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1.5 p-0">
            {pois.slice(0, 6).map((poi, index) => (
              <li
                className="text-label-12 flex items-center gap-2 text-(--color-neutral-8)"
                key={index}
              >
                <span className="size-1 shrink-0 rounded-full bg-(--color-neutral-5)" />
                <span className="truncate">{poiLabel(poi, index)}</span>
              </li>
            ))}
            {pois.length > 6 ? (
              <li className="text-label-12 text-(--color-neutral-6)">
                +{pois.length - 6} 个地点
              </li>
            ) : null}
          </ul>
        ) : null}
        {webOrigin ? (
          <button
            className="text-label-12 mt-3 rounded-lg bg-(--color-neutral-3) px-3 py-1.5 text-(--color-neutral-9)"
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
