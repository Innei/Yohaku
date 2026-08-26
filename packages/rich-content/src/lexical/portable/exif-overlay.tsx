'use client'
import { sx, sxClass } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'

import clsx from 'clsx'
import EXIF from 'exif-js'
import { useEffect, useMemo, useReducer, useState } from 'react'

type ExifRational = {
  denominator?: number
  numerator?: number
}

export type ImageExifData = {
  aperture?: string
  iso?: number
  exposureTime?: string
  device?: string
  focalLength?: string
  equivalent35mmFocalLength?: string
}

type ImageExifRows = {
  device: string | null
  params: string | null
}

type ImageExifState = {
  data: ImageExifData | null
  src: string | undefined
}

function rationalToNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (!value || typeof value !== 'object') return
  const rational = value as ExifRational
  if (!rational.numerator || !rational.denominator) return
  return rational.numerator / rational.denominator
}

function formatAperture(value: unknown): string | undefined {
  const aperture = rationalToNumber(value)
  if (!aperture) return
  return `f/${aperture}`
}

function formatExposureTime(value: unknown): string | undefined {
  if (!value) return
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 1 ? `${value}` : `1/${Math.round(1 / value)}`
  }
  const rational = value as ExifRational
  if (rational.numerator && rational.denominator) {
    return `${rational.numerator}/${rational.denominator}`
  }
}

function formatFocalLength(value: unknown): string | undefined {
  const focalLength = rationalToNumber(value)
  if (!focalLength) return
  return `${Math.round(focalLength)}mm`
}

function buildDevice(make: unknown, model: unknown): string | undefined {
  const makeText = typeof make === 'string' ? make.trim() : ''
  const modelText = typeof model === 'string' ? model.trim() : ''
  if (makeText && modelText) return `${makeText} ${modelText}`
  return makeText || modelText || undefined
}

function hasExifData(data: ImageExifData) {
  return Boolean(
    data.aperture ||
    data.device ||
    data.focalLength ||
    data.equivalent35mmFocalLength ||
    data.iso ||
    data.exposureTime,
  )
}

export function formatImageExifRows(
  exifData: ImageExifData | null,
): ImageExifRows | null {
  if (!exifData) return null
  const focal =
    exifData.equivalent35mmFocalLength ?? exifData.focalLength ?? null
  const params = [
    focal,
    exifData.aperture,
    exifData.exposureTime ? `${exifData.exposureTime}s` : null,
    exifData.iso ? `ISO ${exifData.iso}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const device = exifData.device ?? null
  if (!device && !params) return null
  return { device, params: params || null }
}

export function useImageExifData(src: string | undefined) {
  const [exifState, dispatchExifState] = useReducer(
    (_state: ImageExifState, nextState: ImageExifState) => nextState,
    { data: null, src: undefined },
  )

  useEffect(() => {
    if (!src || src.endsWith('.gif')) return

    let cancelled = false
    const img = new window.Image()
    img.src = src

    img.onload = () => {
      try {
        EXIF.getData(img as any, function (this: any) {
          if (cancelled) return
          const nextExifData: ImageExifData = {
            aperture: formatAperture(EXIF.getTag(this, 'FNumber')),
            iso: EXIF.getTag(this, 'ISOSpeedRatings'),
            exposureTime: formatExposureTime(EXIF.getTag(this, 'ExposureTime')),
            focalLength: formatFocalLength(EXIF.getTag(this, 'FocalLength')),
            equivalent35mmFocalLength: (() => {
              const focalLength35mm = EXIF.getTag(this, 'FocalLengthIn35mmFilm')
              if (focalLength35mm) return `${focalLength35mm}mm`
            })(),
            device: buildDevice(
              EXIF.getTag(this, 'Make'),
              EXIF.getTag(this, 'Model'),
            ),
          }

          if (hasExifData(nextExifData)) {
            dispatchExifState({ data: nextExifData, src })
          }
        })
      } catch (error) {
        console.error('Failed to extract EXIF data:', error)
      }
    }

    return () => {
      cancelled = true
    }
  }, [src])

  return exifState.src === src ? exifState.data : null
}

export function ImageExifOverlay({ src }: { src: string | undefined }) {
  const exifData = useImageExifData(src)
  const [exifOpenState, setExifOpenState] = useState<{
    open: boolean
    src: string | undefined
  }>({ open: false, src: undefined })
  const exifRows = useMemo(() => formatImageExifRows(exifData), [exifData])
  const exifOpen = exifOpenState.src === src ? exifOpenState.open : false

  if (!exifRows) return null

  return (
    <>
      <button
        aria-label={exifOpen ? 'Hide EXIF' : 'Show EXIF'}
        aria-pressed={exifOpen}
        type="button"
        {...sx(
          atoms.pointer_events_auto, atoms.absolute, atoms.right_2dot5, atoms.bottom_2dot5, atoms.z_10,
          atoms.inline_flex, atoms.items_center, atoms.gap_1, atoms.rounded_full, atoms.px_2, atoms.py_1,
          atoms.bg_black_35, atoms.backdrop_blur_xs,
          atoms.font_mono, atoms.text__9px, atoms.tracking__0dot14em, atoms.text_white_85, atoms.uppercase,
          atoms.transition__opacity_scale, atoms.duration_200, atoms.ease_out, atoms.active_scale__0dot96,
          atoms.after_absolute, atoms.after_top_1_2, atoms.after_left_1_2, atoms.after_size_10, atoms.after__translate_x_1_2, atoms.after__translate_y_1_2,
          exifOpen
            ? [atoms.pointer_events_none, atoms.scale_95, atoms.opacity_0]
            : [atoms.scale_100, atoms.opacity_100, atoms.group_hover_image_opacity_0, atoms._dotrr_image_frame_hover_and_opacity_0],
        )}
        onClick={(e) => {
          e.stopPropagation()
          setExifOpenState({ open: true, src })
        }}
      >
        <span {...sx(atoms.size_1, atoms.rounded_full, atoms.bg_white_70)} />
        <span>EXIF</span>
      </button>
      <div
        aria-hidden={!exifOpen}
        {...sxClass("not-prose", atoms.absolute, atoms.inset_0, atoms.z__9, atoms.flex, atoms.flex_col, atoms.justify_end, atoms.p_4, atoms.bg_gradient_to_b, atoms.from_transparent, atoms.via_black_55, atoms.to_black_85, atoms.transition_opacity, atoms.duration__220ms, atoms.ease_out, exifOpen
            ? [atoms.pointer_events_auto, atoms.opacity_100]
            : [atoms.pointer_events_none, atoms.opacity_0, atoms.group_hover_image_opacity_100, atoms._dotrr_image_frame_hover_and_opacity_100])}
        onClick={(e) => {
          e.stopPropagation()
          setExifOpenState({ open: false, src })
        }}
      >
        {exifRows.device && (
          <div {...sx(atoms.font_mono, atoms.text__13px, atoms.tracking__0dot01em, atoms.text_white_95, atoms.text_pretty)}>
            {exifRows.device}
          </div>
        )}
        {exifRows.params && (
          <div
            {...sx(
              atoms.font_mono, atoms.text__11px, atoms.tracking__0dot05em, atoms.text_white_65, atoms.tabular_nums,
              exifRows.device && atoms.mt_0dot5,
            )}
          >
            {exifRows.params}
          </div>
        )}
      </div>
    </>
  )
}
