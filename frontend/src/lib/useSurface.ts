import { useEffect } from 'react'

// Sets the page surface (and optional tier) on the <body>. It intentionally does
// NOT clear the value on unmount: during animated route transitions the outgoing
// page unmounts after the incoming one has already set its surface, so clearing
// here would wipe the new page's surface and drop the header to its default.
// Every top-level page sets a surface on mount, so the last one to mount wins.
export function useSurface(name: string, tier?: string) {
  useEffect(() => {
    document.body.dataset.surface = name
    if (tier) {
      document.body.dataset.tier = tier
    } else {
      delete document.body.dataset.tier
    }
  }, [name, tier])
}
