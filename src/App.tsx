// TODO... Sorting and filtering for event and range views
//             (date sorting, searching)

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth'
import { getDatabase, onValue, ref, remove, set, Unsubscribe } from 'firebase/database'
import { useEffect, useRef, useState } from 'react'
import GoogleButton from 'react-google-button'
import './App.css'
import { createDataset, useWindowSize } from './functions'

// Global Components
import ConfirmDelete from './GlobalComponents/ConfirmDelete'
import Modal from './GlobalComponents/Modal'

// View Imports
import EventView from './views/EventView'
import RangeView from './views/RangeView'
import TimelineView from './views/TimelineView'

// Sidebar Imports
import DatasetOptions from './GlobalComponents/DatasetOptions'
import CreateEventSidebar from './sidebars/CreateEventSidebar'
import CreateRangeSidebar from './sidebars/CreateRangeSidebar'
import DropdownPopout from './sidebars/DropdownPopout'
import { UserData } from './types'

const firebaseConfig = {
  apiKey: 'AIzaSyB4gp1SLXhtv8jzzzdUms6FPDRjLMR1FSI',
  authDomain: 'flynn-projects.firebaseapp.com',
  projectId: 'flynn-projects',
  storageBucket: 'flynn-projects.appspot.com',
  messagingSenderId: '612082775534',
  appId: '1:612082775534:web:1c1110ab5677cf9c768aff',
}

const app = initializeApp(firebaseConfig)
const provider = new GoogleAuthProvider()
export const auth = getAuth(app)
export const db = getDatabase()

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log('Signed in!')
    })
    .catch((error) => {
      console.log('An error occurred while signing in! :(')
    })
}

function App() {
  // Firebase States
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  // App States
  const [currentDataset, setCurrentDataset] = useState<string>('')
  const prevDataset = useRef(currentDataset)
  const [currentView, setCurrentView] = useState('events')
  const prevView = useRef(currentView)
  const [data, setData] = useState<UserData | undefined>(undefined)
  const [width] = useWindowSize()

  // Select Dataset States
  const datasetSelectRef = useRef<HTMLDivElement>(null)
  const [headerSelectDatasetOpened, setHeaderSelectDatasetOpened] = useState(false)
  const [verifyDeleteDataset, setVerifyDeleteDataset] = useState<string | null>(null)
  const [showDatasetOptions, setShowDatasetOptions] = useState<string | null>(null)

  // Edit States
  const [editEvent, setEditEvent] = useState<string | null>(null)
  const [editRange, setEditRange] = useState<string | null>(null)

  // Effects
  // Retrieve auth and database data
  useEffect(() => {
    let dbUnsubcribe: Unsubscribe
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Signed in:', !!user)
      setSignedIn(!!user)
      if (user) {
        const userDataRef = ref(db, 'timeline/users/' + user.uid)

        dbUnsubcribe = onValue(userDataRef, (snapshot) => {
          const data = snapshot.val() as UserData
          console.log('User data:', data)

          if (data) {
            setData(data)
            setCurrentDataset((currentDataset) =>
              currentDataset && Object.keys(data.datasets ?? {}).includes(currentDataset.toString())
                ? currentDataset
                : Object.keys(data.datasets ?? {})[0] ?? -1
            )
          } else {
            setData(undefined)
          }
          if (!data || !data.datasets) {
            set(ref(db, 'timeline/users/' + user.uid + '/datasets'), { 1000: { name: 'main' } })
          }
        })
      }
    })
    return () => {
      authUnsubscribe()
      dbUnsubcribe()
    }
  }, [])

  useEffect(() => {
    if (prevDataset.current !== currentDataset || prevView.current !== currentView) {
      setEditEvent(null)
      setEditRange(null)
    }
    prevDataset.current = currentDataset
    prevView.current = currentView
  }, [currentDataset, currentView])

  if (width <= 565)
    return (
      <div
        style={{
          width: width - 40,
          height: '100%',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <h1 style={{ fontSize: 18, textAlign: 'center' }}>Sorry, your screen is too small to use Flynn's Timline.</h1>
      </div>
    )

  return (
    <div className={'App' + (!signedIn || !data || currentView === 'timeline' ? ' AppHideSidebar' : '')}>
      <header>
        <h1 title='v0.1'>Flynn's Timeline</h1>
        {signedIn && data && (
          <>
            <div
              className={`dropdownSelect ${headerSelectDatasetOpened ? 'dropdownSelectOpened' : ''}`}
              style={{ maxWidth: 160, marginLeft: 10 }}
              ref={datasetSelectRef}
              onClick={() => setHeaderSelectDatasetOpened(!headerSelectDatasetOpened)}>
              <h1>{data?.datasets?.[currentDataset]?.name}</h1>
              <span className='material-symbols-outlined'>expand_more</span>
            </div>
            <span
              className='material-symbols-outlined sidebarIconButton'
              style={{ marginLeft: 5 }}
              onClick={() => setShowDatasetOptions(currentDataset)}>
              settings
            </span>
          </>
        )}
        <DropdownPopout
          show={headerSelectDatasetOpened}
          position={{ top: 45, left: 195 }}
          onExit={() => setHeaderSelectDatasetOpened(false)}
          selectDropdownRef={datasetSelectRef}
          items={Object.keys(data?.datasets ?? {}).map((datasetId) => ({
            id: datasetId,
            name: data?.datasets[datasetId]?.name ?? datasetId,
          }))}
          itemType='dataset'
          selected={currentDataset}
          onSelect={(dataset_id) => setCurrentDataset(dataset_id)}
          onCreate={(name) => data && createDataset(data, name)}
          itemOptions={[{ iconName: 'delete', onClick: (dataset_id) => setVerifyDeleteDataset(dataset_id) }]}
        />
        <Modal show={verifyDeleteDataset} onExit={() => setVerifyDeleteDataset(null)}>
          <ConfirmDelete
            itemName={data?.datasets?.[verifyDeleteDataset ?? '']?.name}
            itemType='all the data in the dataset'
            onConfirm={() => {
              if (!auth.currentUser) throw new Error('No current user while deleting dataset!')
              remove(ref(db, 'timeline/users/' + auth.currentUser.uid + '/' + verifyDeleteDataset))
              remove(ref(db, 'timeline/users/' + auth.currentUser.uid + '/datasets/' + verifyDeleteDataset))
              setVerifyDeleteDataset(null)
            }}
          />
        </Modal>
        <Modal show={showDatasetOptions} onExit={() => setShowDatasetOptions(null)}>
          <DatasetOptions data={data} dataset={currentDataset} />
        </Modal>
        {signedIn && data && (
          <div className='headerActions'>
            <div
              className={`headerTab ${currentView === 'events' ? 'headerTabSelected' : ''}`}
              onClick={() => setCurrentView('events')}>
              <span className='material-symbols-outlined'>event</span>
              <h1>Events</h1>
            </div>
            <div
              className={`headerTab ${currentView === 'ranges' ? 'headerTabSelected' : ''}`}
              onClick={() => setCurrentView('ranges')}>
              <span className='material-symbols-outlined'>arrow_range</span>
              <h1>Ranges</h1>
            </div>
            <div
              className={`headerTab ${currentView === 'timeline' ? 'headerTabSelected' : ''}`}
              onClick={() => setCurrentView('timeline')}>
              <span className='material-symbols-outlined'>timeline</span>
              <h1>Timeline</h1>
            </div>
          </div>
        )}
      </header>
      {signedIn === true && data ? (
        <>
          {currentView === 'events' ? (
            <EventView
              events={data?.[currentDataset]?.events ?? {}}
              editEvent={editEvent}
              setEditEvent={setEditEvent}
            />
          ) : currentView === 'ranges' ? (
            <RangeView
              data={data}
              currentDataset={currentDataset}
              ranges={data?.[currentDataset]?.ranges ?? {}}
              editRange={editRange}
              setEditRange={setEditRange}
            />
          ) : currentView === 'timeline' ? (
            <TimelineView data={data} currentDataset={currentDataset} />
          ) : null}
          {currentView !== 'timeline' ? (
            <div
              style={{
                margin: '20px',
                borderRadius: '10px',
                overflow: 'hidden',
                gridArea: 'sidebar',
                display: 'flex',
              }}>
              {currentView === 'events' ? (
                <CreateEventSidebar
                  data={data}
                  currentDataset={currentDataset}
                  editEvent={editEvent}
                  onCancelEdit={() => setEditEvent(null)}
                />
              ) : currentView === 'ranges' ? (
                <CreateRangeSidebar
                  data={data}
                  currentDataset={currentDataset}
                  editRange={editRange}
                  onCancelEdit={() => setEditRange(null)}
                />
              ) : null}
            </div>
          ) : null}
        </>
      ) : signedIn === false ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 15,
          }}>
          <h2>Not signed in</h2>
          <GoogleButton type='dark' onClick={signIn} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#fffa' }}>Loading...</h2>
        </div>
      )}
    </div>
  )
}

export default App
