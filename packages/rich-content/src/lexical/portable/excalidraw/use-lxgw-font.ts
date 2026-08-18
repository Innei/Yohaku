import { useEffect } from 'react'

const LXGW_HREF = '/fonts/excalidraw/lxgw/lxgw-wenkai-screen.css'

export function useLxgwFont(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.head.querySelector(`link[href="${LXGW_HREF}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = LXGW_HREF
    document.head.appendChild(link)
  }, [])
}
