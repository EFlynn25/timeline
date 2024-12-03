import './EventView.css'
import { parseMonth, parseEventsToMonths } from '../functions'

function EventView({ events, editEvent, setEditEvent }) {
  if (Object.keys(events).length === 0)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#fff8' }}>No events</h2>
      </div>
    )

  const eventsInMonths = parseEventsToMonths(events)

  return (
    <div className='view eventView'>
      {Object.keys(eventsInMonths).map((month) => {
        return (
          <div key={month} className='eventMonth'>
            <h2>{parseMonth(month)}</h2>
            {eventsInMonths[month].map((event) => (
              <p
                key={event.id}
                className={`event ${editEvent === event.id ? 'eventEditing' : ''}`}
                title={event.date + (event.time ? ` at ${event.time}` : '')}
                onClick={() => setEditEvent(editEvent !== event.id ? event.id : -1)}>
                {event.relative} {event.date.slice(3, 5)} - {event.title}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default EventView
