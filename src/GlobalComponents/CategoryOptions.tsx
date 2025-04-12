import { useEffect, useState, useRef } from 'react'
import './OptionsModal.css'
import { db, auth } from '../App'
import { ref, set } from 'firebase/database'

// Local Components
import SelectAccentHue from './SelectAccentHue'
import { UserData } from '../types'

export default function CategoryOptions({
  data,
  dataset,
  categoryID,
}: {
  data: UserData
  dataset: string
  categoryID: string | null
}) {
  const category = categoryID ? data.datasets[dataset]?.categories?.[categoryID] : null

  const prevCategoryID = useRef(categoryID)
  const [nameInput, setNameInput] = useState<string>(category?.name ?? '')
  const [accentHue, setAccentHue] = useState<number>(Number(category?.accentHue ?? -1))

  useEffect(() => {
    if (prevCategoryID.current !== categoryID) {
      setNameInput(category?.name ?? '')
      setAccentHue(Number(category?.accentHue ?? -1))
    }
    prevCategoryID.current = categoryID
  }, [categoryID, category?.name, category?.accentHue])

  if (!category) return null

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ fontSize: 24 }}>Category Settings</h1>
        {(category.name !== nameInput || +(category.accentHue ?? -1) !== +accentHue) && (
          <div
            className='optionsModalSaveChanges'
            style={{
              // @ts-expect-error
              '--accent-hue': `${accentHue > -1 ? accentHue : 220}deg`,
            }}
            onClick={() => {
              const categoryURL = `timeline/users/${auth.currentUser?.uid}/datasets/${dataset}/categories/${categoryID}/`
              if (category.name !== nameInput) {
                set(ref(db, categoryURL + 'name'), nameInput)
              }
              if (!category.accentHue || +category.accentHue !== +accentHue) {
                set(ref(db, categoryURL + 'accentHue'), accentHue)
              }
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
        placeholder='Type category name here'
      />
      <h1 style={{ fontSize: 18, marginTop: 15 }}>Color Accent</h1>
      <SelectAccentHue
        data={data}
        dataset={dataset}
        category={categoryID}
        enabled={true}
        accentHue={accentHue}
        setAccentHue={setAccentHue}
      />
    </div>
  )
}
