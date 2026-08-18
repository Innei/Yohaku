#!/usr/bin/env node
import { createRequire } from 'node:module'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  applyManualSigning,
  resolveManualSigningOptions,
} from './manual-signing.mjs'

const require = createRequire(import.meta.url)
const mobileRoot = fileURLToPath(new URL('..', import.meta.url))
const { getConfig } = require('expo/config')
const { IOSConfig } = require('expo/config-plugins')

const appConfig = getConfig(mobileRoot, {
  skipSDKVersionRequirement: true,
}).exp

const options = resolveManualSigningOptions(process.env, appConfig)

const project = IOSConfig.XcodeUtils.getPbxproj(mobileRoot)
const patched = applyManualSigning(project, options)
if (patched < 4) {
  throw new Error(
    `Expected manual signing on the app and extension debug/release configurations, patched ${patched}.`,
  )
}

const { writeFileSync } = await import('node:fs')
writeFileSync(project.filepath, project.writeSync())
console.log(
  `Applied manual signing to ${patched} build configurations (app: ${options.appProfile}, extension: ${options.extensionProfile}).`,
)
