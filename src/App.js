import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getDatabase, onValue, ref } from "firebase/database";
import GoogleButton from "react-google-button";
import "./App.css";

// View Imports
import EventView from "./views/EventView";
import RangeView from "./views/RangeView";
import TimelineView from "./views/TimelineView";

// Sidebar Imports
import CreateEventSidebar from "./sidebars/CreateEventSidebar";
import CreateRangeSidebar from "./sidebars/CreateRangeSidebar";
import { useWindowSize } from "./functions";

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
	const [currentDataset, setCurrentDataset] = useState("main");
	const [currentView, setCurrentView] = useState("timeline");
	const [data, setData] = useState({});
	const [width] = useWindowSize();
	const [randomizeColor, setRandomizeColor] = useState(false);

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			console.log("Signed in:", !!user);
			setSignedIn(!!user);
			if (user) {
				const userDataRef = ref(db, "timeline/users/" + user.uid);

				onValue(userDataRef, (snapshot) => {
					const data = snapshot.val();
					console.log("User data:", data);

					if (data && randomizeColor) {
						Object.keys(data[currentDataset].ranges).forEach(
							(range_id) => (data[currentDataset].ranges[range_id].accentHue = Math.random() * 361 - 1)
						);
						Object.keys(data[currentDataset].events).forEach(
							(event_id) => (data[currentDataset].events[event_id].accentHue = Math.random() * 361 - 1)
						);
					}

					if (data) setData(data);
					else setData({});
					setDataRetrieved(true);
				});
			}
		});
	}, []);

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
