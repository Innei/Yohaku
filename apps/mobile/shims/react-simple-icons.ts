// Metro does not tree-shake barrel re-exports, so importing
// '@icons-pack/react-simple-icons' by name still pulls all ~3400 brand-logo
// modules (7.6MB) into the DOM bundle. metro.config.js redirects the bare
// specifier here; keep this in sync with the names @haklex/* actually import.
export { default as SiGithub } from '@icons-pack/react-simple-icons/icons/SiGithub.mjs'
export { default as SiTelegram } from '@icons-pack/react-simple-icons/icons/SiTelegram.mjs'
export { default as SiX } from '@icons-pack/react-simple-icons/icons/SiX.mjs'
export { default as SiZhihu } from '@icons-pack/react-simple-icons/icons/SiZhihu.mjs'
