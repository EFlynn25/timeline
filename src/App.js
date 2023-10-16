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
			// const credential = GoogleAuthProvider.credentialFromResult(result);
			// const token = credential.accessToken;
			// const user = result.user;
			console.log("Signed in!");
		})
		.catch((error) => {
			// const errorCode = error.code;
			// const errorMessage = error.message;
			// const email = error.customData.email;
			// const credential = GoogleAuthProvider.credentialFromError(error);
			console.log("An error occurred while signing in! :(");
		});
}

function App() {
	const [signedIn, setSignedIn] = useState(null);
	const [dataRetrieved, setDataRetrieved] = useState(false);
	const [currentDataset, setCurrentDataset] = useState("main");
	const [currentView, setCurrentView] = useState("events");
	const [data, setData] = useState({});

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			console.log("Signed in:", !!user);
			setSignedIn(!!user);
			if (user) {
				const userDataRef = ref(db, "timeline/users/" + user.uid);

				onValue(userDataRef, (snapshot) => {
					const data = snapshot.val();
					console.log("User data:", data);
					if (data) setData(data);
					else setData({});
					setDataRetrieved(true);
				});
			}
		});
	}, []);

	return (
		<div className={"App" + (!signedIn || !dataRetrieved || currentView === "timeline" ? " AppHideSidebar" : "")}>
			<header>
				<h1>Flynn's Timeline</h1>
				{signedIn && dataRetrieved && (
					<div className="headerActions">
						<h1
							style={{ cursor: "pointer", color: currentView !== "events" && "#fff9" }}
							onClick={() => setCurrentView("events")}>
							Events
						</h1>
						<h1
							style={{ cursor: "pointer", color: currentView !== "ranges" && "#fff9" }}
							onClick={() => setCurrentView("ranges")}>
							Ranges
						</h1>
						<h1
							style={{ cursor: "pointer", color: currentView !== "timeline" && "#fff9" }}
							onClick={() => setCurrentView("timeline")}>
							Timeline
						</h1>
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
						<TimelineView dataset={data[currentDataset]} />
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
