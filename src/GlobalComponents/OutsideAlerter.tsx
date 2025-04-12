// Stole this from Stack Overflow (besides the callback
// prop, I did that). I know how to do it but this is a
// dope approach and I was too lazy.

import { PropsWithChildren, RefObject, useEffect, useRef } from 'react'

function useOutsideAlerter(
  ignoreRefs: RefObject<HTMLDivElement | null>[],
  ignoreClasses: string[],
  callback: () => void
) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        ignoreRefs.every((ref) => ref.current && !ref.current.contains(event.target)) &&
        ignoreClasses.every((className) =>
          Array.from(document.getElementsByClassName(className)).every((element) => !element.contains(event.target))
        )
      ) {
        callback()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ignoreRefs, ignoreClasses, callback])
}

export default function OutsideAlerter({
  children,
  callback,
  style,
  ignoreRefs,
  ignoreClasses,
}: PropsWithChildren<{
  callback: () => void
  style?: React.CSSProperties
  ignoreRefs: RefObject<HTMLDivElement | null>[]
  ignoreClasses: string[]
}>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  useOutsideAlerter([wrapperRef].concat(ignoreRefs ?? []), ignoreClasses ?? [], callback)

  return (
    <div ref={wrapperRef} style={style}>
      {children}
    </div>
  )
}
