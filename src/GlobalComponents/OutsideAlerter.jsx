// Stole this from Stack Overflow (besides the callback
// prop, I did that). I know how to do it but this is a
// dope approach and I was too lazy.

import { useRef, useEffect } from 'react'

function useOutsideAlerter(ignoreRefs, ignoreClasses, callback) {
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

export default function OutsideAlerter({ children, callback, style, ignoreRefs, ignoreClasses }) {
  const wrapperRef = useRef(null)
  useOutsideAlerter([wrapperRef].concat(ignoreRefs ?? []), ignoreClasses ?? [], callback)

  return (
    <div ref={wrapperRef} style={style}>
      {children}
    </div>
  )
}
