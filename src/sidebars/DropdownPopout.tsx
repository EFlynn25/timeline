import { ChangeEvent, RefObject } from 'react'
import OutsideAlerter from '../GlobalComponents/OutsideAlerter'

// items - [{ id: number, name: string }]
// onSelect - (id: number) => null
// itemsOptions - [{ iconName: string, onClick: (id: number) => null }]

function DropdownPopout({
  show,
  position,
  onExit,
  selectDropdownRef,
  items,
  itemType,
  selected,
  onSelect,
  onCreate,
  itemOptions,
}: {
  show: boolean
  position: {
    top?: number
    left?: number
    right?: number
    bottom?: number
  }
  onExit: () => void
  selectDropdownRef: RefObject<HTMLDivElement>
  items: { id: string; name: string }[]
  itemType: string
  selected: string
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  itemOptions: { iconName: string; onClick: (id: string) => void }[]
}) {
  return (
    <OutsideAlerter callback={onExit} ignoreRefs={[selectDropdownRef]} ignoreClasses={['modal']}>
      {show && (
        <div
          className='dropdown'
          style={{
            top: position?.top ?? '',
            left: position?.left ?? '',
            right: position?.right ?? '',
            bottom: position?.bottom ?? '',
          }}>
          {items.map(
            (item) =>
              item.id !== selected && (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id)
                    onExit()
                  }}>
                  <h1 style={{ fontWeight: item.id === '-1' ? 'normal' : '' }}>{item.name}</h1>
                  {item.id !== '-1' &&
                    itemOptions.map((itemOption) => (
                      <span
                        key={itemOption.iconName}
                        onClick={(e) => {
                          e.stopPropagation()
                          itemOption.onClick(item.id)
                        }}
                        className='material-symbols-outlined'>
                        {itemOption.iconName}
                      </span>
                    ))}
                </div>
              )
          )}
          <form
            id='createEntry'
            onSubmit={(e: ChangeEvent<HTMLFormElement>) => {
              e.preventDefault()
              onCreate(Object.fromEntries(new FormData(e.target).entries()).entryName as string)
              e.target.reset()
            }}>
            <input
              type='text'
              name='entryName'
              style={{ width: '100%' }}
              placeholder={'Create ' + itemType}
              pattern='[A-Za-z]+'
              title='Alphabetical letters only'
              autoComplete='off'
              autoFocus
            />
            <span
              className='material-symbols-outlined'
              onClick={() => {
                onCreate(Object.fromEntries(new FormData(document.forms['createEntry']).entries()).entryName as string)
                document.forms['createEntry'].reset()
              }}>
              done
            </span>
          </form>
        </div>
      )}
    </OutsideAlerter>
  )
}

export default DropdownPopout
