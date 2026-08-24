'use client'

import type { RichRendererModule } from '@haklex/rich-compose'
import { fileModule, FileRenderer } from '@haklex/rich-compose/modules/file'
import type { FileRendererProps } from '@haklex/rich-editor/renderers'

import { useHost } from '../host'

function SlottedFileRenderer(props: FileRendererProps) {
  const { slots } = useHost()
  const FileCard = slots?.FileCard
  if (FileCard) return <FileCard {...props} />
  return <FileRenderer {...props} />
}

export const yohakuFileModule: RichRendererModule = {
  ...fileModule,
  renderers: { File: SlottedFileRenderer },
}
