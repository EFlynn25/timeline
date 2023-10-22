import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getDatabase, onValue, ref, set, remove } from "firebase/database";
import GoogleButton from "react-google-button";
import OutsideAlerter from "./OutsideAlerter";
import "./App.css";

// View Imports
import EventView from "./views/EventView";
import RangeView from "./views/RangeView";
import TimelineView from "./views/TimelineView";

// Sidebar Imports
import CreateEventSidebar from "./sidebars/CreateEventSidebar";
import CreateRangeSidebar from "./sidebars/CreateRangeSidebar";
import { useWindowSize } from "./functions";
import Modal from "./Modal";

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
	const [signedIn, setSignedIn] = useState(null);
	const [dataRetrieved, setDataRetrieved] = useState(false);
	const [currentDataset, setCurrentDataset] = useState(null);
	const [currentView, setCurrentView] = useState("events");
	const [data, setData] = useState({});
	const [width] = useWindowSize();
	const [randomizeColor, setRandomizeColor] = useState(false);
	const [headerSelectDatasetOpened, setHeaderSelectDatasetOpened] = useState(false);
	const [verifyDeleteDataset, setVerifyDeleteDataset] = useState(-1);

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

	// Randomize colors (will eventually be removed)
	useEffect(() => {
		if (data?.[currentDataset]) {
			if (randomizeColor) {
				const copyData = JSON.parse(JSON.stringify(data));
				Object.keys(copyData[currentDataset].ranges).forEach(
					(range_id) => (copyData[currentDataset].ranges[range_id].accentHue = Math.random() * 361 - 1)
				);
				Object.keys(copyData[currentDataset].events).forEach(
					(event_id) => (copyData[currentDataset].events[event_id].accentHue = Math.random() * 361 - 1)
				);
				setData(copyData);
			} else {
				const copyData = JSON.parse(JSON.stringify(data));
				Object.keys(copyData[currentDataset].ranges).forEach(
					(range_id) => (copyData[currentDataset].ranges[range_id].accentHue = -1)
				);
				Object.keys(copyData[currentDataset].events).forEach(
					(event_id) => (copyData[currentDataset].events[event_id].accentHue = -1)
				);
				setData(copyData);
			}
		}
	}, [randomizeColor]);

	const createDataset = (e) => {
		e.preventDefault();
		const datasetName = Object.fromEntries(new FormData(e.target).entries()).datasetName;
		if (/^[A-Za-z]+$/.test(datasetName) && !Object.values(data.datasets).includes(datasetName)) {
			let my_id = -1;
			do {
				my_id = Math.floor(1000 + Math.random() * 9000);
			} while (Object.keys(data.datasets).includes(my_id));
			set(ref(db, "timeline/users/" + auth.currentUser.uid + "/datasets/" + my_id + "/name"), datasetName);
			e.target.reset();
		}
	};

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
				<h1>Flynn's Timeline</h1>
				<OutsideAlerter callback={() => setHeaderSelectDatasetOpened(false)}>
					{signedIn && (
						<div
							className={`headerSelectDataset ${
								headerSelectDatasetOpened ? "headerSelectDatasetOpened" : ""
							}`}
							onClick={() => setHeaderSelectDatasetOpened(!headerSelectDatasetOpened)}>
							<h1>{data.datasets?.[currentDataset]?.name}</h1>
							<span className="material-symbols-outlined">expand_more</span>
						</div>
					)}
					{headerSelectDatasetOpened && (
						<div className="selectDatasetDropdown">
							{Object.keys(data.datasets ?? {}).map(
								(dataset) =>
									dataset !== currentDataset && (
										<div
											key={dataset}
											onClick={() => {
												setCurrentDataset(dataset);
												setHeaderSelectDatasetOpened(false);
											}}>
											<h1>{data.datasets[dataset]?.name}</h1>
											<span
												onClick={(e) => {
													e.stopPropagation();
													setVerifyDeleteDataset(dataset);
												}}
												className="material-symbols-outlined">
												delete
											</span>
										</div>
									)
							)}
							<form onSubmit={createDataset}>
								<input
									type="text"
									name="datasetName"
									style={{ width: "100%" }}
									placeholder="Create dataset"
									pattern="[A-Za-z]+"
									title="Alphabetical letters only"
									autoComplete="off"
									autoFocus
								/>
								<span className="material-symbols-outlined">done</span>
							</form>
						</div>
					)}
					<Modal show={verifyDeleteDataset > -1} onExit={() => setVerifyDeleteDataset(-1)}>
						<div
							style={{
								width: "100%",
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexDirection: "column",
							}}>
							<h1>Are you sure?</h1>
							<h2 style={{ color: "#f55", textAlign: "center", marginTop: 20 }}>
								This will delete all the data in the dataset "
								{data.datasets?.[verifyDeleteDataset]?.name}"!
							</h2>
							<div
								className="confirmDeleteDataset"
								onClick={() => {
									remove(
										ref(db, "timeline/users/" + auth.currentUser.uid + "/" + verifyDeleteDataset)
									);
									remove(
										ref(
											db,
											"timeline/users/" +
												auth.currentUser.uid +
												"/datasets/" +
												verifyDeleteDataset
										)
									);
									setVerifyDeleteDataset(-1);
									console.log(Object.keys(data.datasets ?? {})[0] ?? -1);
								}}>
								<h1>Delete</h1>
							</div>
						</div>
					</Modal>
				</OutsideAlerter>
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
						<div
							style={{
								width: 20,
								height: 20,
								background:
									"radial-gradient(white, transparent 80%), conic-gradient(hsl(0deg 100% 50%), orange, yellow, green, blue, red)",
								borderRadius: "50%",
								border: randomizeColor ? "1px solid white" : "1px solid hsl(220deg 5% 18%)",
								cursor: "pointer",
							}}
							onClick={() => setRandomizeColor(!randomizeColor)}
						/>
					</div>
				)}
			</header>
			{signedIn === true && dataRetrieved ? (
				<>
					{currentView === "events" ? (
						<EventView events={data[currentDataset]?.events ?? {}} />
					) : currentView === "ranges" ? (
						<RangeView ranges={data[currentDataset]?.ranges ?? {}} />
					) : currentView === "timeline" ? (
						<TimelineView dataset={data[currentDataset] ?? {}} />
					) : null}
					{currentView === "events" ? (
						<CreateEventSidebar data={data} setData={setData} currentDataset={currentDataset} />
					) : currentView === "ranges" ? (
						<CreateRangeSidebar data={data} setData={setData} currentDataset={currentDataset} />
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
