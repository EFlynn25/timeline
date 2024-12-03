import { useState, useRef, useEffect } from 'react'
import { ref, set, remove } from 'firebase/database'
import { auth, db } from '../App'
import {
  createNewID,
  createCategory,
  inputToStorageDate,
  inputToStorageTime,
  storageToInputDate,
  storageToInputTime,
} from '../functions'

// Local Components
import DropdownPopout from './DropdownPopout'

// Global Components
import CategoryOptions from '../GlobalComponents/CategoryOptions'
import ConfirmDelete from '../GlobalComponents/ConfirmDelete'
import Modal from '../GlobalComponents/Modal'
import SelectAccentHue from '../GlobalComponents/SelectAccentHue'

function CreateEventSidebar({ data, currentDataset, editEvent, onCancelEdit }) {
  const prevEditEvent = useRef(editEvent)
  const [validationError, setValidationError] = useState('')
  const createEventStorage = useRef({})
  const [verifyDeleteEvent, setVerifyDeleteEvent] = useState(false)

  // Input States
  const [title, setTitle] = useState('')
  const [relative, setRelative] = useState('=')
  const [date, setDate] = useState('')
  const [includeTime, setIncludeTime] = useState(false)
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  // Category States
  const [category, setCategory] = useState(-1)
  const categorySelectRef = useRef()
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [verifyDeleteCategory, setVerifyDeleteCategory] = useState(-1)
  const [showCategoryOptions, setShowCategoryOptions] = useState(-1)

  // Accent Hue States
  const [enableAccentHue, setEnableAccentHue] = useState(false)
  const [accentHue, setAccentHue] = useState(0)

  // Functions
  const restoreCreateEvent = () => {
    setTitle(createEventStorage.current.title)
    setRelative(createEventStorage.current.relative)
    setDate(createEventStorage.current.date)
    setIncludeTime(createEventStorage.current.includeTime)
    setTime(createEventStorage.current.time)
    setNotes(createEventStorage.current.notes)
    setCategory(createEventStorage.current.category)
    setEnableAccentHue(createEventStorage.current.enableAccentHue)
    setAccentHue(createEventStorage.current.accentHue)
  }

  const formSubmit = (e) => {
    e.preventDefault()

    // Validate form
    if (!title) {
      setValidationError('Please enter a title')
      return
    }
    if (!date || (includeTime && !time)) {
      setValidationError('Please enter valid dates/times')
      return
    }

    // Add event to dataset
    const my_id = editEvent > -1 ? editEvent : createNewID(8, Object.keys(data[currentDataset]?.events ?? {}))
    let newEvent = {
      title,
      notes,
      accentHue: enableAccentHue ? accentHue : null,
      category,
    }
    newEvent.date = inputToStorageDate(date)
    if (relative !== '=') newEvent.relative = relative
    if (includeTime) newEvent.time = inputToStorageTime(time)
    const eventRef = ref(db, `timeline/users/${auth.currentUser.uid}/${currentDataset}/events/${my_id}`)
    set(eventRef, newEvent)

    // Reset form
    if (editEvent > -1) {
      restoreCreateEvent()
      onCancelEdit()
    } else {
      setTitle('')
      setRelative('=')
      setDate('')
      setIncludeTime(false)
      setTime('')
      setNotes('')
      setCategory(-1)
      setEnableAccentHue(false)
      setAccentHue(0)
    }
  }

  // Effects
  useEffect(() => {
    if (prevEditEvent.current !== editEvent) {
      setValidationError('')
      if (editEvent > -1) {
        if (Object.keys(createEventStorage.current).length === 0)
          createEventStorage.current = {
            title,
            relative,
            date,
            includeTime,
            time,
            notes,
            category,
            enableAccentHue,
            accentHue,
          }
        const event = data[currentDataset].events[editEvent]

        setTitle(event.title)
        setRelative(event.relative ?? '=')
        setDate(storageToInputDate(event.date))
        setIncludeTime(!!event.time)
        setTime(!!event.time ? storageToInputTime(event.time) : '')
        setNotes(event.notes)
        setCategory(event.category ?? -1)
        setEnableAccentHue(!!event.accentHue || event.accentHue > -1)
        setAccentHue(event.accentHue ?? 0)
      } else {
        restoreCreateEvent()
        createEventStorage.current = {}
      }
    }
    prevEditEvent.current = editEvent
  }, [
    editEvent,
    title,
    relative,
    date,
    includeTime,
    time,
    notes,
    category,
    enableAccentHue,
    accentHue,
    data,
    currentDataset,
  ])

  return (
    <>
      <form className='sidebar eventSidebar' onSubmit={formSubmit} onInput={() => setValidationError('')}>
        <div className='sidebarTitle'>
          {editEvent > -1 && (
            <span className='material-symbols-outlined' onClick={onCancelEdit}>
              close
            </span>
          )}
          <h1>{editEvent === -1 ? 'Create' : 'Edit'} Event</h1>
        </div>
        <h2>Title</h2>
        <input type='text' name='title' value={title} onChange={(e) => setTitle(e.target.value)} />
        <h2>Date</h2>
        <div className='sidebarRow'>
          <div className='sidebarCheckbox' onClick={() => setIncludeTime(!includeTime)}>
            <input type='checkbox' checked={includeTime} readOnly />
            <h3>Include time</h3>
          </div>
        </div>
        <div className='sidebarRow'>
          <select name='relative' value={relative} onChange={(e) => setRelative(e.target.value)}>
            <option>=</option>
            <option>~</option>
            <option>≥</option>
            <option>≤</option>
            <option>{'<'}</option>
            <option>{'>'}</option>
          </select>
          <input type='date' name='date' value={date} onInput={(e) => setDate(e.target.value)} max='9999-12-31' />
          {includeTime && (
            <input type='time' name='time' step='1' value={time} onInput={(e) => setTime(e.target.value)} />
          )}
        </div>
        <h2>Notes</h2>
        <div className='textareaWrapper'>
          <textarea name='notes' value={notes} onInput={(e) => setNotes(e.target.value)} />
        </div>
        <h2>Category</h2>
        <div className='sidebarRow'>
          <div
            className={`dropdownSelect ${showCategoryPicker ? 'dropdownSelectOpened' : ''}`}
            style={{ maxWidth: 'calc(100% - 60px)' }}
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            ref={categorySelectRef}>
            <h1>{data.datasets[currentDataset].categories?.[category]?.name ?? '--none--'}</h1>
            <span className='material-symbols-outlined'>expand_more</span>
          </div>
          {category > -1 && (
            <span
              className='material-symbols-outlined sidebarIconButton'
              onClick={() => setShowCategoryOptions(category)}>
              settings
            </span>
          )}
        </div>
        <div className='sidebarRow' style={{ marginTop: 10 }}>
          <h2 style={{ fontSize: 18 }}>Color Accent</h2>
          <input
            type='checkbox'
            checked={enableAccentHue}
            style={{ display: 'inline', margin: 0 }}
            onChange={() => setEnableAccentHue(!enableAccentHue)}
          />
        </div>
        <SelectAccentHue
          data={data}
          dataset={currentDataset}
          category={category}
          enabled={enableAccentHue}
          accentHue={accentHue}
          setAccentHue={setAccentHue}
        />
        <input type='submit' />
        {editEvent > -1 && (
          <input
            type='button'
            value='Delete'
            style={{ marginTop: 0, '--accent-hue': '0deg' }}
            onClick={() => {
              setVerifyDeleteEvent(true)
            }}
          />
        )}
        {validationError && (
          <h2 style={{ margin: 0, alignSelf: 'center', color: 'hsl(0deg 70% 60%)' }}>{validationError}</h2>
        )}
      </form>
      <DropdownPopout
        show={showCategoryPicker}
        position={{
          right: 190,
          bottom: window.innerHeight - (categorySelectRef.current?.getBoundingClientRect().top ?? 546.5) + 5,
        }}
        onExit={() => setShowCategoryPicker(false)}
        selectDropdownRef={categorySelectRef}
        items={[-1].concat(Object.keys(data.datasets[currentDataset].categories ?? {})).map((category_id) => ({
          id: category_id,
          name: category_id === -1 ? '--none--' : data.datasets[currentDataset].categories[category_id].name,
        }))}
        itemType='category'
        selected={category}
        onSelect={(category_id) => setCategory(category_id)}
        onCreate={(name) => createCategory(data, currentDataset, name)}
        itemOptions={[{ iconName: 'delete', onClick: (category_id) => setVerifyDeleteCategory(category_id) }]}
      />
      <Modal show={verifyDeleteCategory > -1} onExit={() => setVerifyDeleteCategory(-1)}>
        <ConfirmDelete
          itemName={data.datasets[currentDataset].categories?.[verifyDeleteCategory]?.name}
          itemType='the category'
          onConfirm={() => {
            remove(
              ref(
                db,
                'timeline/users/' +
                  auth.currentUser.uid +
                  '/datasets/' +
                  currentDataset +
                  '/categories/' +
                  verifyDeleteCategory
              )
            )
            setVerifyDeleteCategory(-1)
          }}
        />
      </Modal>
      <Modal show={verifyDeleteEvent} onExit={() => setVerifyDeleteEvent(false)}>
        <ConfirmDelete
          itemName={data[currentDataset]?.events[editEvent]?.title}
          itemType='the event'
          onConfirm={() => {
            remove(ref(db, 'timeline/users/' + auth.currentUser.uid + '/' + currentDataset + '/events/' + editEvent))
            onCancelEdit()
            setVerifyDeleteEvent(false)
          }}
        />
      </Modal>
      <Modal show={showCategoryOptions > -1} onExit={() => setShowCategoryOptions(-1)}>
        <CategoryOptions data={data} dataset={currentDataset} categoryID={showCategoryOptions} />
      </Modal>
    </>
  )
}

export default CreateEventSidebar
