import { useState, useRef } from "react";
import { auth, db } from "../App";
import { ref, set, remove } from "firebase/database";
import { createNewID, createCategory } from "../functions";

// Local Components
import DropdownPopout from "./DropdownPopout";

// Global Components
import CategoryOptions from "../GlobalComponents/CategoryOptions";
import ConfirmDelete from "../GlobalComponents/ConfirmDelete";
import Modal from "../GlobalComponents/Modal";
import SelectAccentHue from "../GlobalComponents/SelectAccentHue";

function CreateRangeSidebar({ data, currentDataset }) {
	const [validationError, setValidationError] = useState("");

	// Checkbox States
	const [uncertainFrom, setUncertainFrom] = useState(false);
	const [includeTimeFrom, setIncludeTimeFrom] = useState(false);
	const [uncertainTo, setUncertainTo] = useState(false);
	const [includeTimeTo, setIncludeTimeTo] = useState(false);
	const [TBD, setTBD] = useState(false);

	// Date/Time Input States
	const [fromDateStart, setFromDateStart] = useState("");
	const [fromDateEnd, setFromDateEnd] = useState("");
	const [fromTimeStart, setFromTimeStart] = useState("");
	const [fromTimeEnd, setFromTimeEnd] = useState("");

	const [toDateStart, setToDateStart] = useState("");
	const [toDateEnd, setToDateEnd] = useState("");
	const [toTimeStart, setToTimeStart] = useState("");
	const [toTimeEnd, setToTimeEnd] = useState("");

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
		if (
			!fromDateStart ||
			(uncertainFrom && !fromDateEnd) ||
			(includeTimeFrom && (!fromTimeStart || !fromTimeEnd)) ||
			(!TBD && (!toDateStart || (uncertainTo && !toDateEnd) || (includeTimeTo && (!toTimeStart || !toTimeEnd))))
		) {
			setValidationError("Please enter valid dates/times");
			return;
		}

		// Add range to dataset
		const my_id = createNewID(8, Object.keys(data[currentDataset]?.ranges ?? {}));
		let newRange = {
			title: formData.title,
			notes: formData.notes,
			accentHue: enableAccentHue ? accentHue : null,
			category,
		};
		if (uncertainFrom) {
			newRange.fromDate = [convertInputDate(formData.fromDateStart), convertInputDate(formData.fromDateEnd)];
			newRange.fromRelative = [formData.fromRelativeStart, formData.fromRelativeEnd];
			if (includeTimeFrom)
				newRange.fromTime = [convertInputTime(formData.fromTimeStart), convertInputTime(formData.fromTimeEnd)];
		} else {
			newRange.fromDate = convertInputDate(formData.fromDate);
			if (formData.fromRelative === "~") newRange.fromRelative = "~";
			if (includeTimeFrom) newRange.fromTime = convertInputTime(formData.fromTime);
		}
		if (TBD) {
			newRange.toDate = "TBD";
		} else if (uncertainTo) {
			newRange.toDate = [convertInputDate(formData.toDateStart), convertInputDate(formData.toDateEnd)];
			newRange.toRelative = [formData.toRelativeStart, formData.toRelativeEnd];
			if (includeTimeTo)
				newRange.toTime = [convertInputTime(formData.toTimeStart), convertInputTime(formData.toTimeEnd)];
		} else {
			newRange.toDate = convertInputDate(formData.toDate);
			if (formData.toRelative === "~") newRange.toRelative = "~";
			if (includeTimeTo) newRange.toTime = convertInputTime(formData.toTime);
		}
		const rangeRef = ref(db, `timeline/users/${auth.currentUser.uid}/${currentDataset}/ranges/${my_id}`);
		set(rangeRef, newRange);

		// Reset form
		setUncertainFrom(false);
		setIncludeTimeFrom(false);
		setUncertainTo(false);
		setIncludeTimeTo(false);
		setTBD(false);
		setFromDateStart("");
		setFromDateEnd("");
		setFromTimeEnd("");
		setFromTimeStart("");
		setToDateStart("");
		setToDateEnd("");
		setToTimeEnd("");
		setToTimeStart("");
		setEnableAccentHue(false);
		setAccentHue(-1);
		e.target.reset();
	};

	return (
		<>
			<form className="sidebar rangeSidebar" onSubmit={formSubmit} onInput={() => setValidationError("")}>
				<h1>Create Range</h1>
				<h2>Title</h2>
				<input type="text" name="title" />
				<h2>From</h2>
				<div className="sidebarRow">
					<div className="sidebarCheckbox" onClick={() => setUncertainFrom(!uncertainFrom)}>
						<input type="checkbox" checked={uncertainFrom} readOnly />
						<h3>Uncertain</h3>
					</div>
					<div className="sidebarCheckbox" onClick={() => setIncludeTimeFrom(!includeTimeFrom)}>
						<input type="checkbox" checked={includeTimeFrom} readOnly />
						<h3>Include time</h3>
					</div>
				</div>
				<div className="sidebarRow">
					{!uncertainFrom ? (
						<select name="fromRelative">
							<option>=</option>
							<option>~</option>
						</select>
					) : (
						<select name="fromRelativeStart">
							<option>≥</option>
							<option>{">"}</option>
						</select>
					)}
					<input
						type="date"
						name={uncertainFrom ? "fromDateStart" : "fromDate"}
						onInput={(e) => setFromDateStart(e.target.value)}
						max={uncertainFrom ? fromDateEnd : "9999-12-31"}
					/>
					{includeTimeFrom && (
						<input
							type="time"
							name={uncertainFrom ? "fromTimeStart" : "fromTime"}
							step="1"
							onInput={(e) => setFromTimeStart(e.target.value)}
							max={uncertainFrom && fromDateStart === fromDateEnd ? fromTimeEnd : ""}
						/>
					)}
				</div>
				{uncertainFrom && (
					<div className="sidebarRow">
						<select name="fromRelativeEnd">
							<option>≤</option>
							<option>{"<"}</option>
						</select>
						<input
							type="date"
							name="fromDateEnd"
							onInput={(e) => setFromDateEnd(e.target.value)}
							min={fromDateStart}
							max="9999-12-31"
						/>
						{includeTimeFrom && (
							<input
								type="time"
								step="1"
								name="fromTimeEnd"
								onInput={(e) => setFromTimeEnd(e.target.value)}
								min={fromDateStart === fromDateEnd ? fromTimeStart : ""}
							/>
						)}
					</div>
				)}
				<h2>To</h2>
				<div className="sidebarRow">
					<div className="sidebarCheckbox" onClick={() => setTBD(!TBD)}>
						<input type="checkbox" checked={TBD} readOnly />
						<h3>TBD</h3>
					</div>
					{!TBD && (
						<>
							<div className="sidebarCheckbox" onClick={() => setUncertainTo(!uncertainTo)}>
								<input type="checkbox" checked={uncertainTo} readOnly />
								<h3>Uncertain</h3>
							</div>
							<div className="sidebarCheckbox" onClick={() => setIncludeTimeTo(!includeTimeTo)}>
								<input type="checkbox" checked={includeTimeTo} readOnly />
								<h3>Include time</h3>
							</div>
						</>
					)}
				</div>
				{!TBD && (
					<>
						<div className="sidebarRow">
							{!uncertainTo ? (
								<select name="toRelative">
									<option>=</option>
									<option>~</option>
								</select>
							) : (
								<select name="toRelativeStart">
									<option>≥</option>
									<option>{">"}</option>
								</select>
							)}
							<input
								type="date"
								name={uncertainTo ? "toDateStart" : "toDate"}
								onInput={(e) => setToDateStart(e.target.value)}
								max={uncertainTo ? toDateEnd : "9999-12-31"}
							/>
							{includeTimeTo && (
								<input
									type="time"
									step="1"
									name={uncertainTo ? "toTimeStart" : "toTime"}
									onInput={(e) => setToTimeStart(e.target.value)}
									max={uncertainTo && toDateStart === toDateEnd ? toTimeEnd : ""}
								/>
							)}
						</div>
						{uncertainTo && (
							<div className="sidebarRow">
								<select name="toRelativeEnd">
									<option>≤</option>
									<option>{"<"}</option>
								</select>
								<input
									type="date"
									name="toDateEnd"
									onInput={(e) => setToDateEnd(e.target.value)}
									min={toDateStart}
									max="9999-12-31"
								/>
								{includeTimeTo && (
									<input
										type="time"
										step="1"
										name="toTimeEnd"
										onInput={(e) => setToTimeEnd(e.target.value)}
										min={toDateStart === toDateEnd ? toTimeStart : ""}
									/>
								)}
							</div>
						)}
					</>
				)}
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

export default CreateRangeSidebar;
