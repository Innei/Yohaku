'use client'

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
        className={clsx(
          'pointer-events-auto absolute right-2.5 bottom-2.5 z-10',
          'inline-flex items-center gap-1 rounded-full px-2 py-1',
          'bg-black/35 backdrop-blur-xs',
          'font-mono text-[9px] tracking-[0.14em] text-white/85 uppercase',
          'transition-[opacity,scale] duration-200 ease-out active:scale-[0.96]',
          'after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2',
          exifOpen
            ? 'pointer-events-none scale-95 opacity-0'
            : 'scale-100 opacity-100 group-hover/image:opacity-0 [.rr-image-frame:hover_&]:opacity-0',
        )}
        onClick={(e) => {
          e.stopPropagation()
          setExifOpenState({ open: true, src })
        }}
      >
        <span className="size-1 rounded-full bg-white/70" />
        <span>EXIF</span>
      </button>
      <div
        aria-hidden={!exifOpen}
        className={clsx(
          'not-prose absolute inset-0 z-[9] flex flex-col justify-end p-4',
          'bg-gradient-to-b from-transparent via-black/55 to-black/85',
          'transition-opacity duration-[220ms] ease-out',
          exifOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0 group-hover/image:opacity-100 [.rr-image-frame:hover_&]:opacity-100',
        )}
        onClick={(e) => {
          e.stopPropagation()
          setExifOpenState({ open: false, src })
        }}
      >
        {exifRows.device && (
          <div className="font-mono text-[13px] tracking-[0.01em] text-white/95 text-pretty">
            {exifRows.device}
          </div>
        )}
        {exifRows.params && (
          <div
            className={clsx(
              'font-mono text-[11px] tracking-[0.05em] text-white/65 tabular-nums',
              exifRows.device && 'mt-0.5',
            )}
          >
            {exifRows.params}
          </div>
        )}
      </div>
    </>
  )
}
