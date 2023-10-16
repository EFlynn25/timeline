import { useState, useLayoutEffect } from "react";

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

/* Dataset parsing */

export function parseEventsToMonths(events) {
	let parsedEvents = {};
	Object.keys(events).forEach((event_id) => {
		const dateComponents = events[event_id].date.split("/");
		const month = dateComponents[0] + "/" + dateComponents[2];
		if (!Object.keys(parsedEvents).includes(month)) {
			parsedEvents[month] = [];
		}
		parsedEvents[month].push({ id: event_id, ...events[event_id] });
	});
	parsedEvents = Object.keys(parsedEvents)
		.sort((a, b) => parseInt(a.slice(3) + a.slice(0, 2)) - parseInt(b.slice(3) + b.slice(0, 2)))
		.reduce((obj, key) => {
			obj[key] = parsedEvents[key];
			return obj;
		}, {});
	Object.keys(parsedEvents).forEach((month) => {
		const numericDate = (date) => parseInt(date.slice(6) + date.slice(0, 2) + date.slice(3, 5));
		const numericTime = (time) =>
			!time
				? 0
				: parseInt(time.slice(0, 2) + time.slice(3, 5) + time.slice(6, 8)) + (time[8] === "p" ? 120000 : 0);

		parsedEvents[month] = parsedEvents[month].sort((a, b) =>
			a.date === b.date ? numericTime(a.time) - numericTime(b.time) : numericDate(a.date) - numericDate(b.date)
		);
	});
	return parsedEvents;
}
export function sortRangesAsIDs(ranges) {
	const dateInt = (date) => parseInt(date.slice(6) + date.slice(0, 2) + date.slice(3, 5));
	const sortedRangeIDs = Object.keys(ranges).sort(
		(a, b) => dateInt(betweenDates(ranges[a].fromDate)) - dateInt(betweenDates(ranges[b].fromDate))
	);
	return sortedRangeIDs;
}

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
