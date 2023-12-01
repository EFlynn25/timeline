// TODO... Sorting and filtering for event and range views
//             (date sorting, searching)

import { useState, useEffect, useRef } from "react";
import "./App.css";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getDatabase, onValue, ref, set, remove } from "firebase/database";
import GoogleButton from "react-google-button";
import { useWindowSize, createDataset } from "./functions";

// Global Components
import ConfirmDelete from "./GlobalComponents/ConfirmDelete";
import Modal from "./GlobalComponents/Modal";

// View Imports
import EventView from "./views/EventView";
import RangeView from "./views/RangeView";
import TimelineView from "./views/TimelineView";

// Sidebar Imports
import CreateEventSidebar from "./sidebars/CreateEventSidebar";
import CreateRangeSidebar from "./sidebars/CreateRangeSidebar";
import DropdownPopout from "./sidebars/DropdownPopout";
import DatasetOptions from "./GlobalComponents/DatasetOptions";

const firebaseConfig = {
	apiKey: "AIzaSyB4gp1SLXhtv8jzzzdUms6FPDRjLMR1FSI",
	authDomain: "flynn-projects.firebaseapp.com",
	projectId: "flynn-projects",
	storageBucket: "flynn-projects.appspot.com",
	messagingSenderId: "612082775534",
	appId: "1:612082775534:web:1c1110ab5677cf9c768aff",
};

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
export const auth = getAuth(app);
export const db = getDatabase();

function signIn() {
	signInWithPopup(auth, provider)
		.then((result) => {
			console.log("Signed in!");
		})
		.catch((error) => {
			console.log("An error occurred while signing in! :(");
		});
}

function App() {
	// Firebase States
	const [signedIn, setSignedIn] = useState(null);
	const [dataRetrieved, setDataRetrieved] = useState(false);

	// App States
	const [currentDataset, setCurrentDataset] = useState(null);
	const prevDataset = useRef(currentDataset);
	const [currentView, setCurrentView] = useState("events");
	const prevView = useRef(currentView);
	const [data, setData] = useState({});
	const [width] = useWindowSize();

	// Select Dataset States
	const datasetSelectRef = useRef();
	const [headerSelectDatasetOpened, setHeaderSelectDatasetOpened] = useState(false);
	const [verifyDeleteDataset, setVerifyDeleteDataset] = useState(-1);
	const [showDatasetOptions, setShowDatasetOptions] = useState(-1);

	// Edit States
	const [editEvent, setEditEvent] = useState(-1);
	const [editRange, setEditRange] = useState(-1);

	// Effects
	// Retrieve auth and database data
	useEffect(() => {
		let dbUnsubcribe;
		const authUnsubscribe = onAuthStateChanged(auth, (user) => {
			console.log("Signed in:", !!user);
			setSignedIn(!!user);
			if (user) {
				const userDataRef = ref(db, "timeline/users/" + user.uid);

				dbUnsubcribe = onValue(userDataRef, (snapshot) => {
					const data = snapshot.val();
					console.log("User data:", data);

					if (data) {
						setData(data);
						setCurrentDataset((currentDataset) =>
							currentDataset && Object.keys(data.datasets ?? {}).includes(currentDataset)
								? currentDataset
								: Object.keys(data.datasets ?? {})[0] ?? -1
						);
					} else {
						setData({});
					}
					if (!data || !data.datasets) {
						set(ref(db, "timeline/users/" + user.uid + "/datasets"), { 1000: { name: "main" } });
					}
					setDataRetrieved(true);
				});
			}
		});
		return () => {
			authUnsubscribe();
			dbUnsubcribe();
		};
	}, []);

	useEffect(() => {
		if (prevDataset.current !== currentDataset || prevView.current !== currentView) {
			setEditEvent(-1);
			setEditRange(-1);
		}
		prevDataset.current = currentDataset;
		prevView.current = currentView;
	}, [currentDataset, currentView]);

	if (width <= 565)
		return (
			<div
				style={{
					width: width - 40,
					height: "100%",
					padding: 20,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
				<h1 style={{ fontSize: 18, textAlign: "center" }}>
					Sorry, your screen is too small to use Flynn's Timline.
				</h1>
			</div>
		);

	return (
		<div className={"App" + (!signedIn || !dataRetrieved || currentView === "timeline" ? " AppHideSidebar" : "")}>
			<header>
				<h1 title="v0.1">Flynn's Timeline</h1>
				{signedIn && (
					<div
						className={`dropdownSelect ${headerSelectDatasetOpened ? "dropdownSelectOpened" : ""}`}
						style={{ maxWidth: 160, marginLeft: 10 }}
						ref={datasetSelectRef}
						onClick={() => setHeaderSelectDatasetOpened(!headerSelectDatasetOpened)}>
						<h1>{data.datasets?.[currentDataset]?.name}</h1>
						<span className="material-symbols-outlined">expand_more</span>
					</div>
				)}
				<span
					className="material-symbols-outlined sidebarIconButton"
					style={{ marginLeft: 5 }}
					onClick={() => setShowDatasetOptions(currentDataset)}>
					settings
				</span>
				<DropdownPopout
					show={headerSelectDatasetOpened}
					position={{ top: 45, left: 195 }}
					onExit={() => setHeaderSelectDatasetOpened(false)}
					selectDropdownRef={datasetSelectRef}
					items={Object.keys(data.datasets ?? {}).map((dataset_id) => ({
						id: dataset_id,
						name: data.datasets[dataset_id]?.name,
					}))}
					itemType="dataset"
					selected={currentDataset}
					onSelect={(dataset_id) => setCurrentDataset(dataset_id)}
					onCreate={(name) => createDataset(data, name)}
					itemOptions={[{ iconName: "delete", onClick: (dataset_id) => setVerifyDeleteDataset(dataset_id) }]}
				/>
				<Modal show={verifyDeleteDataset > -1} onExit={() => setVerifyDeleteDataset(-1)}>
					<ConfirmDelete
						itemName={data.datasets?.[verifyDeleteDataset]?.name}
						itemType="all the data in the dataset"
						onConfirm={() => {
							remove(ref(db, "timeline/users/" + auth.currentUser.uid + "/" + verifyDeleteDataset));
							remove(
								ref(db, "timeline/users/" + auth.currentUser.uid + "/datasets/" + verifyDeleteDataset)
							);
							setVerifyDeleteDataset(-1);
						}}
					/>
				</Modal>
				<Modal show={showDatasetOptions > -1} onExit={() => setShowDatasetOptions(-1)}>
					<DatasetOptions data={data} dataset={currentDataset} />
				</Modal>
				{signedIn && dataRetrieved && (
					<div className="headerActions">
						<div
							className={`headerTab ${currentView === "events" ? "headerTabSelected" : ""}`}
							onClick={() => setCurrentView("events")}>
							<span className="material-symbols-outlined">event</span>
							<h1>Events</h1>
						</div>
						<div
							className={`headerTab ${currentView === "ranges" ? "headerTabSelected" : ""}`}
							onClick={() => setCurrentView("ranges")}>
							<span className="material-symbols-outlined">arrow_range</span>
							<h1>Ranges</h1>
						</div>
						<div
							className={`headerTab ${currentView === "timeline" ? "headerTabSelected" : ""}`}
							onClick={() => setCurrentView("timeline")}>
							<span className="material-symbols-outlined">timeline</span>
							<h1>Timeline</h1>
						</div>
					</div>
				)}
			</header>
			{signedIn === true && dataRetrieved ? (
				<>
					{currentView === "events" ? (
						<EventView
							events={data[currentDataset]?.events ?? {}}
							editEvent={editEvent}
							setEditEvent={setEditEvent}
						/>
					) : currentView === "ranges" ? (
						<RangeView
							data={data}
							currentDataset={currentDataset}
							ranges={data[currentDataset]?.ranges ?? {}}
							editRange={editRange}
							setEditRange={setEditRange}
						/>
					) : currentView === "timeline" ? (
						<TimelineView data={data} currentDataset={currentDataset} />
					) : null}
					{currentView === "events" ? (
						<CreateEventSidebar
							data={data}
							currentDataset={currentDataset}
							editEvent={editEvent}
							onCancelEdit={() => setEditEvent(-1)}
						/>
					) : currentView === "ranges" ? (
						<CreateRangeSidebar
							data={data}
							currentDataset={currentDataset}
							editRange={editRange}
							onCancelEdit={() => setEditRange(-1)}
						/>
					) : null}
				</>
			) : signedIn === false ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "column",
						gap: 15,
					}}>
					<h2>Not signed in</h2>
					<GoogleButton type="dark" onClick={signIn} />
				</div>
			) : (
				<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
					<h2 style={{ color: "#fffa" }}>Loading...</h2>
				</div>
			)}
		</div>
	);
}

export default App;
