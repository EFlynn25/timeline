import { useEffect, useState, useRef } from 'react'
import './OptionsModal.css'
import { db, auth } from '../App'
import { ref, set } from 'firebase/database'

function DatasetOptions({ data, dataset }) {
  const datasetObj = data.datasets?.[dataset]

  const prevDataset = useRef(dataset)
  const [nameInput, setNameInput] = useState(datasetObj?.name ?? '')

  useEffect(() => {
    if (prevDataset.current !== dataset) {
      setNameInput(datasetObj?.name ?? '')
    }
    prevDataset.current = dataset
  }, [dataset, datasetObj?.name])

  if (!datasetObj) return null

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ fontSize: 24 }}>Dataset Settings</h1>
        {datasetObj.name !== nameInput && (
          <div
            className='optionsModalSaveChanges'
            style={{
              '--accent-hue': '220deg',
            }}
            onClick={() => {
              const datasetURL = `timeline/users/${auth.currentUser.uid}/datasets/${dataset}/`
              if (datasetObj.name !== nameInput) set(ref(db, datasetURL + 'name'), nameInput)
            }}>
            <h1 style={{ fontSize: 16 }}>Save Changes</h1>
          </div>
        )}
      </div>
      <h1 style={{ fontSize: 18, marginTop: 15 }}>Name</h1>
      <input
        type='text'
        style={{ width: 'calc(70% - 7px)', marginTop: 5 }}
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        placeholder='Type dataset name here'
      />
    </div>
  )
}

export default DatasetOptions
