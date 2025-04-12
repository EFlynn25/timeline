import { Dispatch, SetStateAction } from 'react'
import { UserData } from '../types'
import './SelectAccentHue.css'

export default function SelectAccentHue({
  data,
  dataset,
  category,
  enabled,
  accentHue,
  setAccentHue,
}: {
  data: UserData
  dataset: string
  category: string | null
  enabled: boolean
  accentHue: number
  setAccentHue: Dispatch<SetStateAction<number>>
}) {
  const categoryAccentHue = category ? data.datasets[dataset].categories?.[category]?.accentHue : -1

  return (
    <div className='selectAccentHue'>
      {enabled ? (
        <>
          <input
            type='range'
            className='selectAccentHueSlider'
            min={-1}
            max={360}
            value={accentHue}
            style={{
              // @ts-expect-error
              '--slider-accent-hue': `${accentHue}deg`,
              '--slider-accent-lightness': +accentHue === -1 ? '100%' : '65%',
            }}
            onChange={(e) => setAccentHue(Number(e.target.value) || -1)}
          />
          <input
            type='number'
            min={-1}
            max={360}
            value={accentHue}
            onChange={(e) => setAccentHue(Number(e.target.value) || -1)}
          />
          {+accentHue === -1 && <p style={{ fontSize: 14, fontStyle: 'italic' }}>No color</p>}
        </>
      ) : (
        <>
          <div
            style={{
              width: 15,
              height: 15,
              marginLeft: 6,
              borderRadius: 7.5,
              backgroundColor: Number(categoryAccentHue) > -1 ? `hsl(${categoryAccentHue}deg 70% 65%)` : 'white',
            }}
          />
          <p style={{ fontSize: 14, fontStyle: 'italic' }}>
            Defaults to {Number(category) > -1 ? 'category color' : 'white'}
          </p>
        </>
      )}
    </div>
  )
}
