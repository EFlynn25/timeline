import { useState, useRef, useEffect } from "react";
import { ref, set, remove } from "firebase/database";
import { auth, db } from "../App";
import {
	createNewID,
	createCategory,
	inputToStorageDate,
	inputToStorageTime,
	storageToInputDate,
	storageToInputTime,
} from "../functions";

// Local Components
import DropdownPopout from "./DropdownPopout";

// Global Components
import CategoryOptions from "../GlobalComponents/CategoryOptions";
import ConfirmDelete from "../GlobalComponents/ConfirmDelete";
import Modal from "../GlobalComponents/Modal";
import SelectAccentHue from "../GlobalComponents/SelectAccentHue";

function CreateRangeSidebar({ data, currentDataset, editRange, onCancelEdit }) {
	const prevEditRange = useRef(editRange);
	const [validationError, setValidationError] = useState("");
	const createRangeStorage = useRef({});
	const [verifyDeleteRange, setVerifyDeleteRange] = useState(false);

	// Input States
	const [title, setTitle] = useState("");

	// ...from
	const [uncertainFrom, setUncertainFrom] = useState(false);
	const [includeTimeFrom, setIncludeTimeFrom] = useState(false);
	const [fromRelativeStart, setFromRelativeStart] = useState("=");
	const [fromRelativeEnd, setFromRelativeEnd] = useState("=");
	const [fromDateStart, setFromDateStart] = useState("");
	const [fromDateEnd, setFromDateEnd] = useState("");
	const [fromTimeStart, setFromTimeStart] = useState("");
	const [fromTimeEnd, setFromTimeEnd] = useState("");

	// ...to
	const [TBD, setTBD] = useState(false);
	const [uncertainTo, setUncertainTo] = useState(false);
	const [includeTimeTo, setIncludeTimeTo] = useState(false);
	const [toRelativeStart, setToRelativeStart] = useState("=");
	const [toRelativeEnd, setToRelativeEnd] = useState("=");
	const [toDateStart, setToDateStart] = useState("");
	const [toDateEnd, setToDateEnd] = useState("");
	const [toTimeStart, setToTimeStart] = useState("");
	const [toTimeEnd, setToTimeEnd] = useState("");

	const [notes, setNotes] = useState("");

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
	// const inputToStorageDate = (inputDate) => `${inputDate.slice(5, 7)}/${inputDate.slice(8)}/${inputDate.slice(0, 4)}`;
	// const inputToStorageTime = (inputTime) => {
	// 	const timeComponents = inputTime.split(":");
	// 	const hour12 = parseInt(timeComponents[0] % 12)
	// 		.toString()
	// 		.padStart(2, "0");
	// 	const ampm = +timeComponents[0] - 12 < 0 ? "am" : "pm";
	// 	return `${hour12 === "00" ? "12" : hour12}:${timeComponents[1]}:${timeComponents[2]}${ampm}`;
	// };
	const restoreCreateRange = () => {
		setTitle(createRangeStorage.current.title);
		setUncertainFrom(createRangeStorage.current.uncertainFrom);
		setIncludeTimeFrom(createRangeStorage.current.includeTimeFrom);
		setFromRelativeStart(createRangeStorage.current.fromRelativeStart);
		setFromRelativeEnd(createRangeStorage.current.fromRelativeEnd);
		setFromDateStart(createRangeStorage.current.fromDateStart);
		setFromDateEnd(createRangeStorage.current.fromDateEnd);
		setFromTimeStart(createRangeStorage.current.fromTimeStart);
		setFromTimeEnd(createRangeStorage.current.fromTimeEnd);
		setTBD(createRangeStorage.current.TBD);
		setUncertainTo(createRangeStorage.current.uncertainTo);
		setIncludeTimeTo(createRangeStorage.current.includeTimeTo);
		setToRelativeStart(createRangeStorage.current.toRelativeStart);
		setToRelativeEnd(createRangeStorage.current.toRelativeEnd);
		setToDateStart(createRangeStorage.current.toDateStart);
		setToDateEnd(createRangeStorage.current.toDateEnd);
		setToTimeStart(createRangeStorage.current.toTimeStart);
		setToTimeEnd(createRangeStorage.current.toTimeEnd);
		setNotes(createRangeStorage.current.notes);
		setCategory(createRangeStorage.current.category);
		setEnableAccentHue(createRangeStorage.current.enableAccentHue);
		setAccentHue(createRangeStorage.current.accentHue);
	};

	const formSubmit = (e) => {
		e.preventDefault();
		// const formData = Object.fromEntries(new FormData(e.target).entries());

		// Validate form
		if (!title) {
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
		// const my_id = createNewID(8, Object.keys(data[currentDataset]?.ranges ?? {}));
		const my_id = editRange > -1 ? editRange : createNewID(8, Object.keys(data[currentDataset]?.ranges ?? {}));
		let newRange = {
			title: title,
			notes: notes,
			accentHue: enableAccentHue ? accentHue : null,
			category,
		};
		if (uncertainFrom) {
			newRange.fromDate = [inputToStorageDate(fromDateStart), inputToStorageDate(fromDateEnd)];
			newRange.fromRelative = [fromRelativeStart, fromRelativeEnd];
			if (includeTimeFrom)
				newRange.fromTime = [inputToStorageTime(fromTimeStart), inputToStorageTime(fromTimeEnd)];
		} else {
			newRange.fromDate = inputToStorageDate(fromDateStart);
			if (fromRelativeStart === "~") newRange.fromRelative = "~";
			if (includeTimeFrom) newRange.fromTime = inputToStorageTime(fromTimeStart);
		}
		if (TBD) {
			newRange.toDate = "TBD";
		} else if (uncertainTo) {
			newRange.toDate = [inputToStorageDate(toDateStart), inputToStorageDate(toDateEnd)];
			newRange.toRelative = [toRelativeStart, toRelativeEnd];
			if (includeTimeTo) newRange.toTime = [inputToStorageTime(toTimeStart), inputToStorageTime(toTimeEnd)];
		} else {
			newRange.toDate = inputToStorageDate(toDateStart);
			if (toRelativeStart === "~") newRange.toRelative = "~";
			if (includeTimeTo) newRange.toTime = inputToStorageTime(toTimeStart);
		}
		const rangeRef = ref(db, `timeline/users/${auth.currentUser.uid}/${currentDataset}/ranges/${my_id}`);
		set(rangeRef, newRange);

		// Reset form
		if (editRange > -1) {
			restoreCreateRange();
			onCancelEdit();
		} else {
			setTitle("");
			setUncertainFrom(false);
			setIncludeTimeFrom(false);
			setFromRelativeStart("=");
			setFromRelativeEnd("=");
			setFromDateStart("");
			setFromDateEnd("");
			setFromTimeStart("");
			setFromTimeEnd("");
			setTBD(false);
			setUncertainTo(false);
			setIncludeTimeTo(false);
			setToRelativeStart("=");
			setToRelativeEnd("=");
			setToDateStart("");
			setToDateEnd("");
			setToTimeStart("");
			setToTimeEnd("");
			setNotes("");
			setCategory(-1);
			setEnableAccentHue(false);
			setAccentHue(-1);
		}
	};

	// Effects
	useEffect(() => {
		if (prevEditRange.current !== editRange) {
			setValidationError("");
			if (editRange > -1) {
				if (Object.keys(createRangeStorage.current).length === 0)
					createRangeStorage.current = {
						title,
						uncertainFrom,
						includeTimeFrom,
						fromRelativeStart,
						fromRelativeEnd,
						fromDateStart,
						fromDateEnd,
						fromTimeStart,
						fromTimeEnd,
						TBD,
						uncertainTo,
						includeTimeTo,
						toRelativeStart,
						toRelativeEnd,
						toDateStart,
						toDateEnd,
						toTimeStart,
						toTimeEnd,
						notes,
						category,
						enableAccentHue,
						accentHue,
					};
				const range = data[currentDataset].ranges[editRange];
				console.log(range);
				const thisUncertainFrom = Array.isArray(range.fromDate);
				const thisTBD = range.toDate === "TBD";
				const thisUncertainTo = Array.isArray(range.toDate);

				setTitle(range.title);
				setUncertainFrom(thisUncertainFrom);
				setIncludeTimeFrom(!!range.fromTime);
				setFromRelativeStart(thisUncertainFrom ? range.fromRelative[0] ?? "≥" : range.fromRelative ?? "=");
				setFromRelativeEnd(thisUncertainFrom ? range.fromRelative[1] ?? "≤" : "=");
				setFromDateStart(storageToInputDate(thisUncertainFrom ? range.fromDate[0] : range.fromDate));
				setFromDateEnd(thisUncertainFrom ? storageToInputDate(range.fromDate[1]) : "");
				setFromTimeStart(
					!!range.fromTime ? storageToInputTime(thisUncertainFrom ? range.fromTime[0] : range.fromTime) : ""
				);
				setFromTimeEnd(thisUncertainFrom && !!range.fromTime ? storageToInputTime(range.fromTime[1]) : "");
				setTBD(thisTBD);
				setUncertainTo(thisUncertainTo);
				setIncludeTimeTo(!!range.toTime);
				setToRelativeStart(thisUncertainTo ? range.toRelative[0] ?? "≥" : range.toRelative ?? "=");
				setToRelativeEnd(thisUncertainTo ? range.toRelative[1] ?? "≤" : "=");
				setToDateStart(storageToInputDate(thisUncertainTo ? range.toDate[0] : range.toDate));
				setToDateEnd(thisUncertainTo ? storageToInputDate(range.toDate[1]) : "");
				setToTimeStart(
					!!range.toTime ? storageToInputTime(thisUncertainTo ? range.toTime[0] : range.toTime) : ""
				);
				setToTimeEnd(thisUncertainTo && !!range.toTime ? storageToInputTime(range.toTime[1]) : "");
				setNotes(range.notes);
				setCategory(range.category ?? -1);
				setEnableAccentHue(!!range.accentHue || range.accentHue > -1);
				setAccentHue(range.accentHue ?? 0);
			} else {
				restoreCreateRange();
				createRangeStorage.current = {};
			}
		}
		prevEditRange.current = editRange;
	});

	return (
		<>
			<form className="sidebar rangeSidebar" onSubmit={formSubmit} onInput={() => setValidationError("")}>
				<div className="sidebarTitle">
					{editRange > -1 && (
						<span className="material-symbols-outlined" onClick={onCancelEdit}>
							close
						</span>
					)}
					<h1>{editRange === -1 ? "Create" : "Edit"} Range</h1>
				</div>
				<h2>Title</h2>
				<input type="text" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
				<h2>From</h2>
				<div className="sidebarRow">
					<div
						className="sidebarCheckbox"
						onClick={() => {
							if (uncertainFrom) {
								setFromRelativeStart("=");
							} else {
								setFromRelativeStart("≥");
								setFromRelativeEnd("≤");
							}
							setUncertainFrom(!uncertainFrom);
						}}>
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
						<select
							name="fromRelative"
							value={fromRelativeStart}
							onInput={(e) => setFromRelativeStart(e.target.value)}>
							<option>=</option>
							<option>~</option>
						</select>
					) : (
						<select
							name="fromRelativeStart"
							value={fromRelativeStart}
							onInput={(e) => setFromRelativeStart(e.target.value)}>
							<option>≥</option>
							<option>{">"}</option>
						</select>
					)}
					<input
						type="date"
						name={uncertainFrom ? "fromDateStart" : "fromDate"}
						value={fromDateStart}
						onInput={(e) => setFromDateStart(e.target.value)}
						max={uncertainFrom ? fromDateEnd : "9999-12-31"}
					/>
					{includeTimeFrom && (
						<input
							type="time"
							name={uncertainFrom ? "fromTimeStart" : "fromTime"}
							value={fromTimeStart}
							onInput={(e) => setFromTimeStart(e.target.value)}
							step="1"
							max={uncertainFrom && fromDateStart === fromDateEnd ? fromTimeEnd : ""}
						/>
					)}
				</div>
				{uncertainFrom && (
					<div className="sidebarRow">
						<select
							name="fromRelativeEnd"
							value={fromRelativeEnd}
							onInput={(e) => setFromRelativeEnd(e.target.value)}>
							<option>≤</option>
							<option>{"<"}</option>
						</select>
						<input
							type="date"
							name="fromDateEnd"
							value={fromDateEnd}
							onInput={(e) => setFromDateEnd(e.target.value)}
							min={fromDateStart}
							max="9999-12-31"
						/>
						{includeTimeFrom && (
							<input
								type="time"
								step="1"
								name="fromTimeEnd"
								value={fromTimeEnd}
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
							<div
								className="sidebarCheckbox"
								onClick={() => {
									if (uncertainTo) {
										setToRelativeStart("=");
									} else {
										setToRelativeStart("≥");
										setToRelativeEnd("≤");
									}
									setUncertainTo(!uncertainTo);
								}}>
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
								<select
									name="toRelative"
									value={toRelativeStart}
									onInput={(e) => setToRelativeStart(e.target.value)}>
									<option>=</option>
									<option>~</option>
								</select>
							) : (
								<select
									name="toRelativeStart"
									value={toRelativeStart}
									onInput={(e) => setToRelativeStart(e.target.value)}>
									<option>≥</option>
									<option>{">"}</option>
								</select>
							)}
							<input
								type="date"
								name={uncertainTo ? "toDateStart" : "toDate"}
								value={toDateStart}
								onInput={(e) => setToDateStart(e.target.value)}
								max={uncertainTo ? toDateEnd : "9999-12-31"}
							/>
							{includeTimeTo && (
								<input
									type="time"
									name={uncertainTo ? "toTimeStart" : "toTime"}
									value={toTimeStart}
									onInput={(e) => setToTimeStart(e.target.value)}
									step="1"
									max={uncertainTo && toDateStart === toDateEnd ? toTimeEnd : ""}
								/>
							)}
						</div>
						{uncertainTo && (
							<div className="sidebarRow">
								<select
									name="toRelativeEnd"
									value={toRelativeEnd}
									onInput={(e) => setToRelativeEnd(e.target.value)}>
									<option>≤</option>
									<option>{"<"}</option>
								</select>
								<input
									type="date"
									name="toDateEnd"
									value={toDateEnd}
									onInput={(e) => setToDateEnd(e.target.value)}
									min={toDateStart}
									max="9999-12-31"
								/>
								{includeTimeTo && (
									<input
										type="time"
										name="toTimeEnd"
										value={toTimeEnd}
										onInput={(e) => setToTimeEnd(e.target.value)}
										step="1"
										min={toDateStart === toDateEnd ? toTimeStart : ""}
									/>
								)}
							</div>
						)}
					</>
				)}
				<h2>Notes</h2>
				<textarea name="notes" value={notes} onInput={(e) => setNotes(e.target.value)} />
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
				{editRange > -1 && (
					<input
						type="button"
						value="Delete"
						style={{ marginTop: 0, "--accent-hue": "0deg" }}
						onClick={() => {
							setVerifyDeleteRange(true);
						}}
					/>
				)}
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
					itemType="the category"
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
			<Modal show={verifyDeleteRange} onExit={() => setVerifyDeleteRange(false)}>
				<ConfirmDelete
					itemName={data[currentDataset]?.ranges[editRange]?.title}
					itemType="the range"
					onConfirm={() => {
						remove(
							ref(
								db,
								"timeline/users/" + auth.currentUser.uid + "/" + currentDataset + "/ranges/" + editRange
							)
						);
						onCancelEdit();
						setVerifyDeleteRange(false);
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
