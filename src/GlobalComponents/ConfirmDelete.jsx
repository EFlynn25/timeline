import { useEffect, useState } from 'react'
import './ConfirmDelete.css'

function ConfirmDelete({ itemName, itemType, onConfirm }) {
  const [currentName, setCurrentName] = useState(itemName)

  useEffect(() => {
    if (itemName) setCurrentName(itemName)
  }, [itemName])

  return (
    <div className='confirmDelete'>
      <h1>Are you sure?</h1>
      <h2 style={{ color: '#f55', textAlign: 'center', marginTop: 20 }}>
        This will delete {itemType} "{currentName}"!
      </h2>
      <div className='confirmDeleteButton' onClick={onConfirm}>
        <h1>Delete</h1>
      </div>
    </div>
  )
}

export default ConfirmDelete
