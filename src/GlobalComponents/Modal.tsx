import { PropsWithChildren, useRef } from 'react'
import './Modal.css'

export default function Modal({
  children,
  show,
  onExit,
  width = 400,
  height = 250,
}: PropsWithChildren<{ show: boolean; onExit: () => void; width?: number; height?: number }>) {
  const mouseDown = useRef(false)

  return (
    <div
      className={`modal ${show ? 'modalShow' : ''}`}
      onMouseDown={() => (mouseDown.current = true)}
      onMouseUp={() => {
        if (mouseDown.current) {
          mouseDown.current = false
          onExit?.()
        }
      }}>
      <div
        className='modalContent'
        style={{ width, height }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => {
          e.stopPropagation()
          mouseDown.current = false
        }}>
        {children}
      </div>
    </div>
  )
}
