import { useState } from "react";
import { ref, set } from "firebase/database";
import { auth, db } from "../App";

function CreateEventSidebar({ data, currentDataset }) {
	const [validationError, setValidationError] = useState("");

	// Checkbox States
	const [includeTime, setIncludeTime] = useState(false);

	// Date/Time Input States
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");

	// Functions
	const convertInputDate = (inputDate) => `${inputDate.slice(5, 7)}/${inputDate.slice(8)}/${inputDate.slice(0, 4)}`;
	const convertInputTime = (inputTime) => {
		const timeComponents = inputTime.split(":");
		const hour12 = parseInt(timeComponents[0] % 12)
			.toString()
			.padStart(2, "0");
		const ampm = timeComponents[0] - 12 <= 0 ? "am" : "pm";
		return `${hour12 === "00" ? "12" : hour12}:${timeComponents[1]}:${timeComponents[2]}${ampm}`;
	};
	const formSubmit = (e) => {
		e.preventDefault();
		const formData = Object.fromEntries(new FormData(e.target).entries());

		// Validate form
		if (!formData.title) {
			setValidationError("Please enter a title");
			return;
		}
		if (!date || (includeTime && !time)) {
			setValidationError("Please enter valid dates/times");
			return;
		}

		// Add event to dataset
		let my_id = 0;
		do {
			my_id = Math.floor(10000000 + Math.random() * 90000000);
		} while (Object.keys(data[currentDataset]?.events ?? {}).includes(my_id));
		let newEvent = {
			title: formData.title,
			notes: formData.notes,
		};
		newEvent.date = convertInputDate(formData.date);
		if (formData.relative !== "=") newEvent.relative = formData.relative;
		if (includeTime) newEvent.time = convertInputTime(formData.time);
		const eventRef = ref(db, `timeline/users/${auth.currentUser.uid}/${currentDataset}/events/${my_id}`);
		set(eventRef, newEvent);

		// Reset form
		setIncludeTime(false);
		setDate("");
		setTime("");
		e.target.reset();
	};

	return (
		<form className="sidebar eventSidebar" onSubmit={formSubmit} onInput={() => setValidationError("")}>
			<h1>Create Event</h1>
			<h2>Title</h2>
			<input type="text" name="title" />
			<h2>Date</h2>
			<div className="sidebarRow">
				<div className="sidebarCheckbox" onClick={() => setIncludeTime(!includeTime)}>
					<input type="checkbox" checked={includeTime} readOnly />
					<h3>Include time</h3>
				</div>
			</div>
			<div className="sidebarRow">
				<select name="relative">
					<option>=</option>
					<option>~</option>
					<option>≥</option>
					<option>≤</option>
					<option>{"<"}</option>
					<option>{">"}</option>
				</select>
				<input type="date" name="date" onInput={(e) => setDate(e.target.value)} max="9999-12-31" />
				{includeTime && <input type="time" name="time" step="1" onInput={(e) => setTime(e.target.value)} />}
			</div>
			<h2>Notes</h2>
			<textarea name="notes" />
			<h2>Category</h2>
			{/* <select name="category">
				<option>--none--</option>
				<option>Cars</option>
				<option>Phones</option>
				<option>Houses</option>
			</select> */}
			<input type="submit" />
			{validationError && (
				<h2 style={{ margin: 0, alignSelf: "center", color: "hsl(0deg 70% 60%)" }}>{validationError}</h2>
			)}
		</form>
	);
}

export default CreateEventSidebar;
