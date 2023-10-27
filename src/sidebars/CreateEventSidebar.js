import { useState, useRef } from "react";
import { ref, set, remove } from "firebase/database";
import { auth, db } from "../App";
import { createNewID, createCategory } from "../functions";

// Local Components
import DropdownPopout from "./DropdownPopout";

// Global Components
import CategoryOptions from "../GlobalComponents/CategoryOptions";
import ConfirmDelete from "../GlobalComponents/ConfirmDelete";
import Modal from "../GlobalComponents/Modal";
import SelectAccentHue from "../GlobalComponents/SelectAccentHue";

function CreateEventSidebar({ data, currentDataset }) {
	const [validationError, setValidationError] = useState("");

	// Checkbox States
	const [includeTime, setIncludeTime] = useState(false);

	// Date/Time Input States
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");

	// Category States
	const [category, setCategory] = useState(-1);
	const categorySelectRef = useRef();
	const [showCategoryPicker, setShowCategoryPicker] = useState(false);
	const [verifyDeleteCategory, setVerifyDeleteCategory] = useState(-1);
	const [showCategoryOptions, setShowCategoryOptions] = useState(-1);

	// Accent Hue States
	const [enableAccentHue, setEnableAccentHue] = useState(false);
	const [accentHue, setAccentHue] = useState(0);

	// Functions
	const convertInputDate = (inputDate) => `${inputDate.slice(5, 7)}/${inputDate.slice(8)}/${inputDate.slice(0, 4)}`;
	const convertInputTime = (inputTime) => {
		const timeComponents = inputTime.split(":");
		const hour12 = parseInt(timeComponents[0] % 12)
			.toString()
			.padStart(2, "0");
		const ampm = +timeComponents[0] - 12 < 0 ? "am" : "pm";
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
		const my_id = createNewID(8, Object.keys(data[currentDataset]?.events ?? {}));
		let newEvent = {
			title: formData.title,
			notes: formData.notes,
			accentHue: enableAccentHue ? accentHue : null,
			category,
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
		setEnableAccentHue(false);
		setAccentHue(-1);
		e.target.reset();
	};

	return (
		<>
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
				<div className="sidebarRow">
					<div
						className={`dropdownSelect ${showCategoryPicker ? "dropdownSelectOpened" : ""}`}
						style={{ maxWidth: "calc(100% - 60px)" }}
						onClick={() => setShowCategoryPicker(!showCategoryPicker)}
						ref={categorySelectRef}>
						<h1>{data.datasets[currentDataset].categories?.[category]?.name ?? "--none--"}</h1>
						<span className="material-symbols-outlined">expand_more</span>
					</div>
					{category > -1 && (
						<span
							className="material-symbols-outlined sidebarIconButton"
							onClick={() => setShowCategoryOptions(category)}>
							settings
						</span>
					)}
				</div>
				<div className="sidebarRow" style={{ marginTop: 10 }}>
					<h2 style={{ fontSize: 18 }}>Color Accent</h2>
					<input
						type="checkbox"
						checked={enableAccentHue}
						style={{ display: "inline", margin: 0 }}
						onChange={(e) => setEnableAccentHue(!enableAccentHue)}
					/>
				</div>
				<SelectAccentHue
					data={data}
					dataset={currentDataset}
					category={category}
					enabled={enableAccentHue}
					accentHue={accentHue}
					setAccentHue={setAccentHue}
				/>
				<input type="submit" />
				{validationError && (
					<h2 style={{ margin: 0, alignSelf: "center", color: "hsl(0deg 70% 60%)" }}>{validationError}</h2>
				)}
			</form>
			<DropdownPopout
				show={showCategoryPicker}
				position={{
					right: 190,
					bottom: window.innerHeight - (categorySelectRef.current?.getBoundingClientRect().top ?? 546.5) + 5,
				}}
				onExit={() => setShowCategoryPicker(false)}
				selectDropdownRef={categorySelectRef}
				items={[-1].concat(Object.keys(data.datasets[currentDataset].categories ?? {})).map((category_id) => ({
					id: category_id,
					name: category_id === -1 ? "--none--" : data.datasets[currentDataset].categories[category_id].name,
				}))}
				itemType="category"
				selected={category}
				onSelect={(category_id) => setCategory(category_id)}
				onCreate={(name) => createCategory(data, currentDataset, name)}
				itemOptions={[{ iconName: "delete", onClick: (category_id) => setVerifyDeleteCategory(category_id) }]}
			/>
			<Modal show={verifyDeleteCategory > -1} onExit={() => setVerifyDeleteCategory(-1)}>
				<ConfirmDelete
					itemName={data.datasets[currentDataset].categories?.[verifyDeleteCategory]?.name}
					itemType="category"
					onConfirm={() => {
						remove(
							ref(
								db,
								"timeline/users/" +
									auth.currentUser.uid +
									"/datasets/" +
									currentDataset +
									"/categories/" +
									verifyDeleteCategory
							)
						);
						setVerifyDeleteCategory(-1);
					}}
				/>
			</Modal>
			<Modal show={showCategoryOptions > -1} onExit={() => setShowCategoryOptions(-1)}>
				<CategoryOptions data={data} dataset={currentDataset} categoryID={showCategoryOptions} />
			</Modal>
		</>
	);
}

export default CreateEventSidebar;
