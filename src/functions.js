import { useState, useLayoutEffect } from "react";
import { auth, db } from "./App";
import { ref, set } from "firebase/database";

/* Constants */

export const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
export const MINUTE = 1000 * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const YEAR = DAY * 365;

/* Date parsing */

export function convertToDate(date, time) {
	if (time)
		return new Date(
			date.slice(6),
			+date.slice(0, 2) - 1,
			date.slice(3, 5),
			+time.slice(0, 2) + (time[8] === "0" ? 12 : 0) - (+time.slice(0, 2) === 12 ? 12 : 0),
			time.slice(3, 5),
			time.slice(6, 8)
		);
	else return new Date(date.slice(6), +date.slice(0, 2) - 1, date.slice(3, 5));
}
export function numericDate(date) {
	return parseInt(date.slice(6) + date.slice(0, 2) + date.slice(3, 5));
}
export function numericTime(time) {
	return !time
		? 0
		: parseInt(time.slice(0, 2) + time.slice(3, 5) + time.slice(6, 8)) +
				(time[8] === "p" ? 120000 : 0) -
				(+time.slice(0, 2) === 12 ? 120000 : 0);
}
export function inputToStorageDate(inputDate) {
	return `${inputDate.slice(5, 7)}/${inputDate.slice(8)}/${inputDate.slice(0, 4)}`;
}
export function inputToStorageTime(inputTime) {
	const timeComponents = inputTime.split(":");
	const hour12 = parseInt(timeComponents[0] % 12)
		.toString()
		.padStart(2, "0");
	const ampm = +timeComponents[0] - 12 < 0 ? "am" : "pm";
	return `${hour12 === "00" ? "12" : hour12}:${timeComponents[1]}:${timeComponents[2]}${ampm}`;
}
export function storageToInputDate(date) {
	return `${date.slice(6)}-${date.slice(0, 2)}-${date.slice(3, 5)}`;
}
export function storageToInputTime(time) {
	const hour = +time.slice(0, 2);
	const pm = time[8] === "p";
	const newHour = hour + (!pm && hour === 12 ? -12 : pm && hour !== 12 ? 12 : 0);
	return `${newHour.toString().padStart(2, "0")}:${time.slice(3, 5)}:${time.slice(6, 8)}`;
}
export function parseDate(date) {
	if (date === "TBD") return date;
	const dateComponents = date.split("/");
	return `${monthNames[parseInt(dateComponents[0]) - 1].slice(0, 3)} ${dateComponents[1]}, ${dateComponents[2]}`;
}
export function parseMonth(month) {
	const monthComponents = month.split("/");
	return `${monthNames[parseInt(monthComponents[0]) - 1].slice(0, 3)} ${monthComponents[1]}`;
}
export function betweenDates(date) {
	if (typeof date === "string") return date;
	const dateComponentsStart = date[0].split("/");
	const dateComponentsEnd = date[1].split("/");
	const dateStart = new Date(dateComponentsStart[2], dateComponentsStart[0], dateComponentsStart[1]);
	const dateEnd = new Date(dateComponentsEnd[2], dateComponentsEnd[0], dateComponentsEnd[1]);
	const dateMiddle = new Date((dateStart.getTime() + dateEnd.getTime()) / 2);

	return (
		dateMiddle.getMonth().toString().padStart(2, "0") +
		"/" +
		dateMiddle.getDate().toString().padStart(2, "0") +
		"/" +
		dateMiddle.getFullYear().toString()
	);
}
export function parseRangeDate(date, relative) {
	return typeof date === "string"
		? (relative === "~" ? relative : relative ? relative + " " : "") + parseDate(date)
		: (relative ? relative[0] + " " : "≥ ") +
				parseDate(date[0]) +
				" & " +
				(relative ? relative[1] + " " : "≤ ") +
				parseDate(date[1]);
}
export function parseRangeTitle(date, time, relative) {
	return typeof date === "string" && !time
		? (relative === "~" ? relative : relative ? relative + " " : "") + date
		: typeof date === "string" && typeof time === "string"
		? (relative === "~" ? relative : relative ? relative + " " : "") + date + " at " + time
		: (relative ? relative[0] + " " : "≥ ") +
		  (typeof date === "string" ? date : date[0]) +
		  (!time ? "" : " at " + (typeof time === "string" ? time : time[0])) +
		  " & " +
		  (relative ? relative[1] + " " : "≤ ") +
		  (typeof date === "string" ? date : date[1]) +
		  (!time ? "" : " at " + (typeof time === "string" ? time : time[1]));
}

/* Dataset parsing */

export function sortEventsAsIDs(events) {
	if (!events) return [];

	const sortedEventIDs = Object.keys(events).sort((a, b) =>
		events[a].date === events[b].date
			? numericTime(events[a].time) - numericTime(events[b].time)
			: numericDate(events[a].date) - numericDate(events[b].date)
	);
	return sortedEventIDs;
}
export function sortRangesAsIDs(ranges, sortType = "between") {
	if (!ranges) return [];

	const dateHinge = (date) => {
		const start = Array.isArray(date) ? date[0] : date;
		// Saving below for alternate sorting methods
		// const end = Array.isArray(date) ? date[1] : date;
		return sortType === "start" ? start : betweenDates(date);
	};

	const sortedRangeIDs = Object.keys(ranges)
		.filter((range_id) => ranges[range_id] !== undefined)
		.sort(
			(a, b) =>
				numericDate(betweenDates(dateHinge(ranges[a].fromDate))) -
				numericDate(betweenDates(dateHinge(ranges[b].fromDate)))
		);
	return sortedRangeIDs;
}
export function parseEventsToMonths(events) {
	if (!events || Object.keys(events).length === 0) return {};

	// Sort into months
	let parsedEvents = {};
	const sortedEventIDs = sortEventsAsIDs(events);
	sortedEventIDs.forEach((event_id) => {
		const dateComponents = events[event_id].date.split("/");
		const month = dateComponents[0] + "/" + dateComponents[2];
		if (!Object.keys(parsedEvents).includes(month)) {
			parsedEvents[month] = [];
		}
		parsedEvents[month].push({ id: event_id, ...events[event_id] });
	});

	// Convert array to object, while sorting months
	parsedEvents = Object.keys(parsedEvents)
		.sort((a, b) => parseInt(a.slice(3) + a.slice(0, 2)) - parseInt(b.slice(3) + b.slice(0, 2)))
		.reduce((obj, key) => {
			obj[key] = parsedEvents[key];
			return obj;
		}, {});
	return parsedEvents;
}
export function parseEventsToCategories(data, currentDataset, events) {
	if (!events) return {};

	const sortedEventIDs = sortEventsAsIDs(events);
	let eventsAsCategories = {};
	sortedEventIDs.forEach((event_id) => {
		const eventCategory = events[event_id].category?.toString();
		const myCategory = Object.keys(data.datasets[currentDataset].categories ?? {}).includes(eventCategory)
			? eventCategory
			: "-1";
		if (!Object.keys(eventsAsCategories).includes(myCategory)) eventsAsCategories[myCategory] = [];
		eventsAsCategories[myCategory].push(event_id);
	});

	return eventsAsCategories;
}
export function parseRangesToCategories(ranges) {
	if (!ranges) return {};

	const sortedRangeIDs = sortRangesAsIDs(ranges, "start");
	let rangesAsCategories = {};
	sortedRangeIDs.forEach((range_id) => {
		const myCategory = ranges[range_id].category?.toString() ?? "-1";
		if (!Object.keys(rangesAsCategories).includes(myCategory)) rangesAsCategories[myCategory] = [];
		rangesAsCategories[myCategory].push(range_id);
	});

	return rangesAsCategories;
}

/* Misc Functions */

export function createNewID(places, currentIDs) {
	currentIDs = currentIDs.map((id) => +id);
	let my_id = -1;
	do {
		my_id = Math.floor(10 ** (places - 1) + Math.random() * 9 * 10 ** (places - 1));
	} while (currentIDs.includes(my_id));
	return my_id;
}

export const createDataset = (data, datasetName) => {
	if (
		/^[A-Za-z]+$/.test(datasetName) &&
		Object.values(data.datasets).every((dataset) => dataset.name !== datasetName)
	) {
		const my_id = createNewID(4, Object.keys(data.datasets));
		set(ref(db, "timeline/users/" + auth.currentUser.uid + "/datasets/" + my_id + "/name"), datasetName);
	}
};

export const createCategory = (data, currentDataset, categoryName) => {
	if (
		/^[A-Za-z]+$/.test(categoryName) &&
		Object.values(data.datasets[currentDataset].categories ?? {}).every(
			(category) => category.name !== categoryName
		)
	) {
		const my_id = createNewID(4, Object.keys(data.datasets[currentDataset].categories ?? {}));
		set(
			ref(
				db,
				"timeline/users/" +
					auth.currentUser.uid +
					"/datasets/" +
					currentDataset +
					"/categories/" +
					my_id +
					"/name"
			),
			categoryName
		);
	}
};

/* Hooks */

export function useWindowSize() {
	const [size, setSize] = useState([0, 0]);
	useLayoutEffect(() => {
		function updateSize() {
			setSize([window.innerWidth, window.innerHeight]);
		}
		window.addEventListener("resize", updateSize);
		updateSize();
		return () => window.removeEventListener("resize", updateSize);
	}, []);
	return size;
}
