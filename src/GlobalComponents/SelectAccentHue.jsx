import './SelectAccentHue.css'

function SelectAccentHue({ data, dataset, category, enabled, accentHue, setAccentHue }) {
  const categoryAccentHue = data.datasets[dataset].categories?.[category]?.accentHue

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
              '--slider-accent-hue': `${accentHue}deg`,
              '--slider-accent-lightness': +accentHue === -1 ? '100%' : '65%',
            }}
            onChange={(e) => setAccentHue(e.target.value)}
          />
          <input type='number' min={-1} max={360} value={accentHue} onChange={(e) => setAccentHue(e.target.value)} />
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
              backgroundColor:
                category > -1 && +categoryAccentHue > -1 ? `hsl(${categoryAccentHue}deg 70% 65%)` : 'white',
            }}
          />
          <p style={{ fontSize: 14, fontStyle: 'italic' }}>Defaults to {category > -1 ? 'category color' : 'white'}</p>
        </>
      )}
    </div>
  )
}

export default SelectAccentHue
