import { useState, useEffect, useRef, useCallback } from "react";
import "./TimelineView.css";
import {
	DAY,
	YEAR,
	convertToDate,
	monthNames,
	numericDate,
	numericTime,
	parseDate,
	parseEventsToMonths,
	parseRangeDate,
	sortRangesAsIDs,
	useWindowSize,
} from "../functions";

function renderTimeline(dataset, canvas, start, scrollY, viewRange, width, timestampToGraph) {
	console.log("Rendering...");
	const context = canvas.getContext("2d");
	const msPerPixel = viewRange / width;

	// Scale canvas for clarity
	context.scale(window.devicePixelRatio, window.devicePixelRatio);

	// Clear canvas
	context.beginPath();
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Draw events
	let eventsDepth = 65;
	let eventsDisplayed = {};
	const drawEvent = (timestamp, event_id, y = 100) => {
		const x = timestampToGraph(timestamp);
		const r = 5;
		context.beginPath();
		context.arc(x, (y || 100) - scrollY, r, 0, 2 * Math.PI);
		context.fillStyle = "white";
		if (dataset.events[event_id].accentHue > -1)
			context.fillStyle = `hsl(${dataset.events[event_id].accentHue}deg 50% 60%)`;
		context.fill();
		eventsDisplayed[event_id] = [
			[x - r, y - r - scrollY],
			[x + r, y + r - scrollY],
		];
		if (y + r > eventsDepth) eventsDepth = y + r;
	};
	let eventDatesDisplayed = {};
	const eventsInMonths = parseEventsToMonths(dataset.events);
	Object.keys(eventsInMonths).forEach((month) => {
		eventsInMonths[month].forEach((event) => {
			let date = convertToDate(event.date, event.time);

			if (Object.keys(eventDatesDisplayed).includes(date.getTime().toString())) {
				drawEvent(date.getTime(), event.id, 100 + eventDatesDisplayed[date.getTime()] * 15);
				eventDatesDisplayed[date.getTime()]++;
			} else {
				drawEvent(date.getTime(), event.id);
				eventDatesDisplayed[date.getTime()] = 1;
			}
		});
	});

	// Draw ranges
	let rangeLayers = {};
	let rangesDisplayed = {};
	const drawRange = (fromTimestamp, fromUncertainty, toTimestamp, toUncertainty, range_id) => {
		let TBD = toTimestamp === "TBD";
		if (TBD) toTimestamp = Date.now();

		const accentHue = dataset.ranges[range_id].accentHue;
		let y = eventsDepth - scrollY + 35;
		if (Object.keys(rangeLayers).length === 0) {
			rangeLayers[0] = [[fromTimestamp, toTimestamp]];
		} else {
			let foundSpace = false;
			for (let layer = 0; layer < Object.keys(rangeLayers).length; layer++) {
				let blocked = false;
				for (let i = 0; i < rangeLayers[layer].length; i++) {
					const range = rangeLayers[layer][i];
					if (fromTimestamp >= range[0] && fromTimestamp < range[1]) {
						blocked = true;
						break;
					}
				}
				if (!blocked) {
					y += layer * 15;
					rangeLayers[layer].push([fromTimestamp, toTimestamp]);
					foundSpace = true;
					break;
				}
			}
			if (!foundSpace) {
				const new_layer = Object.keys(rangeLayers).length;
				y += new_layer * 15;
				rangeLayers[new_layer] = [[fromTimestamp, toTimestamp]];
			}
		}
		rangesDisplayed[range_id] = [
			[timestampToGraph(fromTimestamp), y - scrollY],
			[timestampToGraph(toTimestamp), y + 10 - scrollY],
		];

		// Render range
		let rangeBG = "hsl(220deg 5% 100%)";
		let rangeWidth = timestampToGraph(toTimestamp - fromTimestamp + start);
		if (accentHue > -1) rangeBG = `hsl(${accentHue}deg 50% 60%)`;
		context.beginPath();
		context.fillStyle = rangeBG;
		context.rect(timestampToGraph(fromTimestamp), y, rangeWidth, 10);
		context.fill();

		// Render text
		context.beginPath();
		context.textAlign = "left";
		context.textBaseline = "middle";
		context.font = `bold 10px Gabarito, sans-serif`;
		context.fillStyle = `hsl(0deg 5% 12%)`;
		context.fillText(dataset.ranges[range_id].title, Math.max(timestampToGraph(fromTimestamp + fromUncertainty), 0) + 2, y + 5);
		if (TBD && rangeWidth >= 23) {
			context.beginPath();
			context.fillStyle = rangeBG;
			context.rect(timestampToGraph(toTimestamp) - 23, y, 23, 10);
			// context.rect(timestampToGraph(toTimestamp) - Math.min(23, rangeWidth), y, Math.min(23, rangeWidth), 10);
			context.fill();

			context.beginPath();
			context.textAlign = "right";
			context.textBaseline = "middle";
			context.font = `bold 10px Gabarito, sans-serif`;
			context.fillStyle = `hsl(0deg 5% 12%)`;
			context.fillText("TBD", timestampToGraph(toTimestamp) - 2, y + 5);
		}

		// Render uncertainty
		if (fromUncertainty) {
			context.beginPath();
			context.fillStyle = "hsl(220deg 5% 40%)";
			if (accentHue > -1) context.fillStyle = `hsl(${accentHue}deg 25% 35%)`;
			context.rect(timestampToGraph(fromTimestamp), y, timestampToGraph(fromUncertainty + start), 10);
			context.fill();
		}
		if (toUncertainty && !TBD) {
			context.beginPath();
			context.fillStyle = "hsl(220deg 5% 40%)";
			if (accentHue > -1) context.fillStyle = `hsl(${accentHue}deg 25% 35%)`;
			context.rect(timestampToGraph(toTimestamp - toUncertainty), y, timestampToGraph(toUncertainty + start), 10);
			context.fill();
		}
	};
	const sortedRangeIDs = sortRangesAsIDs(dataset.ranges ?? {}, "start");
	sortedRangeIDs.forEach((range_id) => {
		const range = dataset.ranges[range_id];
		const startDate = Array.isArray(range.fromDate) ? range.fromDate[0] : range.fromDate;
		const startTime = range.fromTime ? (Array.isArray(range.fromTime) ? range.fromTime[0] : range.fromTime) : null;
		const endDate = Array.isArray(range.toDate) ? range.toDate[1] : range.toDate;
		const endTime = range.toTime ? (Array.isArray(range.toTime) ? range.toTime[1] : range.toTime) : null;
		drawRange(
			convertToDate(startDate, startTime).getTime(),
			Array.isArray(range.fromDate)
				? convertToDate(range.fromDate[1], range.fromTime?.[1]).getTime() -
						convertToDate(range.fromDate[0], range.fromTime?.[0]).getTime()
				: 0,
			endDate === "TBD" ? "TBD" : convertToDate(endDate, endTime).getTime(),
			Array.isArray(range.toDate)
				? convertToDate(range.toDate[1], range.toTime?.[1]).getTime() -
						convertToDate(range.toDate[0], range.toTime?.[0]).getTime()
				: 0,
			range_id
		);
	});

	// Draw tick background
	context.beginPath();
	context.fillStyle = "hsl(220deg 5% 15%)";
	context.rect(0, 0, canvas.width, 60);
	context.fill();

	// Draw tick marks
	const drawTick = (timestamp, height = 30, lightness = 100) => {
		context.beginPath();
		context.moveTo(timestampToGraph(timestamp), 0);
		context.lineTo(timestampToGraph(timestamp), height || 30);
		context.strokeStyle = `hsl(0deg 0% ${lightness || 100}%)`;
		context.stroke();
	};
	const drawTickText = (timestamp, text, lightness = 100, fontSize = 16, y = 30) => {
		context.beginPath();
		context.textAlign = "center";
		context.textBaseline = "top";
		context.font = `bold ${fontSize || 16}px Gabarito, sans-serif`;
		context.fillStyle = `hsl(0deg 0% ${lightness || 100}%)`;
		context.fillText(text, timestampToGraph(timestamp), (y || 30) + 5);
	};
	const date = new Date(new Date(start).toDateString());
	if (msPerPixel < 34000000) {
		// Render month (and maybe day) ticks
		date.setDate(1);
		date.setMonth(date.getMonth() - 1);
		let currentDate = date.getDate();
		for (let i = 0; i < Math.ceil(viewRange / DAY) + 62; i++) {
			date.setDate(currentDate + 1);
			currentDate = date.getDate();
			if (date.getDate() === 1) {
				drawTick(date.getTime());
				drawTickText(
					date.getTime(),
					`${monthNames[date.getMonth()].slice(0, 3).toUpperCase()} ${date.getFullYear()}`
				);
			} else if (msPerPixel < DAY / 4) {
				drawTick(date.getTime(), 20, 60);
			}
		}
	} else if (msPerPixel < 70000000) {
		// Render odd month ticks
		date.setDate(1);
		let currentMonth = date.getMonth();
		date.setMonth(currentMonth - 1);
		for (let i = 0; i < Math.ceil((12 * viewRange) / YEAR) + 12; i++) {
			date.setMonth(currentMonth + 1);
			currentMonth = date.getMonth();
			if (currentMonth % 2 === 0) {
				drawTick(date.getTime());
				drawTickText(
					date.getTime(),
					`${monthNames[currentMonth].slice(0, 3).toUpperCase()} ${date.getFullYear()}`
				);
			} else {
				drawTick(date.getTime(), 20, 60);
			}
		}
	} else if (msPerPixel < 250000000) {
		// Render half year (and small month) ticks
		date.setDate(1);
		let currentMonth = date.getMonth();
		date.setMonth(currentMonth - 1);
		for (let i = 0; i < Math.ceil((12 * viewRange) / YEAR) + 12; i++) {
			date.setMonth(currentMonth + 1);
			currentMonth = date.getMonth();
			if (currentMonth % 6 === 0) {
				drawTick(date.getTime(), currentMonth === 6 && 25, currentMonth === 6 && 75);
				drawTickText(
					date.getTime(),
					`${monthNames[currentMonth].slice(0, 3).toUpperCase()} ${date.getFullYear()}`,
					currentMonth === 6 && 80,
					currentMonth === 6 && 12
				);
			} else {
				drawTick(date.getTime(), 15, 60);
			}
		}
	} else if (msPerPixel < 850000000) {
		// Render half year ticks
		date.setDate(1);
		let currentMonth = date.getMonth();
		date.setMonth(currentMonth - 1);
		for (let i = 0; i < Math.ceil((12 * viewRange) / YEAR) + 12; i++) {
			date.setMonth(currentMonth + 1);
			currentMonth = date.getMonth();
			if (currentMonth % 6 === 0) {
				drawTick(date.getTime(), currentMonth === 6 && 25, currentMonth === 6 && 75);
				if (currentMonth === 0) {
					drawTickText(date.getTime(), date.getFullYear());
				}
			}
		}
	} else if (msPerPixel) {
		// Render year ticks
		date.setDate(1);
		date.setMonth(0);
		for (let i = 0; i < Math.ceil(viewRange / YEAR) + 1; i++) {
			date.setFullYear(date.getFullYear() + 1);
			if (date.getFullYear() % 5 === 0) {
				drawTick(date.getTime());
				drawTickText(date.getTime(), date.getFullYear());
			} else {
				drawTick(date.getTime(), 20, 60);
			}
		}
	}
	// Draw "now" (today) line
	const nowX = timestampToGraph(Date.now());
	context.beginPath();
	context.moveTo(nowX, 0);
	context.lineTo(nowX, canvas.height);
	context.strokeStyle = "hsl(220deg 30% 60%)"
	context.stroke();

	// Reset canvas scaling
	context.scale(0.5, 0.5);

	return {
		events: eventsDisplayed,
		ranges: rangesDisplayed,
		scrollHeight: (eventsDepth + Object.keys(rangeLayers).length * 25) * 2 + 20,
	};
}

function TimelineView({ dataset }) {
	// Event states
	const [width, height] = useWindowSize();
	const [mousePos, setMousePos] = useState([0, 0]);
	const [mouseDown, setMouseDown] = useState(false);

	// Canvas states
	const canvasRef = useRef(null);
	const [start, setStart] = useState(Date.now() - YEAR * 0.375);
	const [scrollY, setScrollY] = useState(0);
	const [viewRange, setViewRange] = useState(YEAR / 2);

	// Tooltip states
	const [canvasReturn, setCanvasReturn] = useState({});
	const [showEventTooltip, setShowEventTooltip] = useState(-1);
	const [showRangeTooltip, setShowRangeTooltip] = useState(-1);
	const tooltipRange = dataset.ranges?.[showRangeTooltip];

	// Functions
	const timestampToGraph = useCallback(
		(timestamp) => (width * (timestamp - start)) / viewRange,
		[width, start, viewRange]
	);
	const graphToTimestamp = useCallback((x) => (x * viewRange) / width + start, [viewRange, width, start]);

	// Event handlers
	const canvasScroll = (e) => {
		const scrollClamp = 40;
		const clampedDelta = Math.min(Math.max(e.deltaY, -scrollClamp), scrollClamp);
		let newViewRange = viewRange * (1 + clampedDelta / 250);
		if (newViewRange / width >= 4300000000) {
			newViewRange = width * 4300000000;
		} else if (newViewRange <= DAY) {
			newViewRange = DAY;
		}
		setViewRange(newViewRange);
		setStart(start - (newViewRange - viewRange) * (mousePos[0] / width));
	};
	const canvasMouseMove = (e) => {
		const newX = e.clientX;
		const newY = e.clientY - 51;
		if (mouseDown) {
			setStart(graphToTimestamp(timestampToGraph(start) - newX + mousePos[0]));
			setScrollY(
				Math.min(
					Math.max(0, scrollY - newY + mousePos[1]),
					Math.max((canvasReturn.scrollHeight - canvasRef.current.height) / 2, 0)
				)
			);
		}
		setMousePos([newX, newY]);

		// Event tooltip
		let currentDate = null;
		let currentTime = null;
		let eventToShow = -1;
		Object.keys(canvasReturn.events ?? {}).forEach((event_id) => {
			const event = canvasReturn.events[event_id];
			if (newX >= event[0][0] && newX <= event[1][0] && newY >= event[0][1] && newY <= event[1][1]) {
				const numDate = numericDate(dataset.events[event_id].date);
				const numTime = numericTime(dataset.events[event_id].time);
				if (!currentDate || numDate > currentDate || (numDate === currentDate && numTime > currentTime)) {
					currentDate = numDate;
					currentTime = numTime;
					eventToShow = event_id;
				}
			}
		});
		setShowEventTooltip(eventToShow);

		// Range tooltip
		let rangeToShow = -1;
		const rangeIDs = Object.keys(canvasReturn.ranges ?? {});
		for (let i = 0; i < rangeIDs.length; i++) {
			const range = canvasReturn.ranges[rangeIDs[i]];
			if (newX >= range[0][0] && newX <= range[1][0] && newY >= range[0][1] && newY <= range[1][1]) {
				rangeToShow = rangeIDs[i];
				break;
			}
		}
		setShowRangeTooltip(rangeToShow);
	};

	// Rendering
	useEffect(() => {
		if (width > 0)
			setCanvasReturn(
				renderTimeline(dataset, canvasRef.current, start, scrollY, viewRange, width, timestampToGraph)
			);
	}, [dataset, canvasRef, start, scrollY, viewRange, width, height, timestampToGraph]);

	return (
		<div className="view timelineView">
			<canvas
				ref={canvasRef}
				width={Math.floor(width * window.devicePixelRatio)}
				height={Math.floor((height - 50) * window.devicePixelRatio)}
				onWheel={canvasScroll}
				onMouseMove={canvasMouseMove}
				onMouseDown={() => setMouseDown(true)}
				onMouseLeave={() => setMouseDown(false)}
				onMouseUp={() => setMouseDown(false)}
			/>
			{showEventTooltip > 0 && (
				<div
					className="tooltip"
					style={{
						transform: `translateX(${Math.min(mousePos[0], width - 430)}px) translateY(${Math.min(
							mousePos[1],
							height - 280
						)}px)`,
						backgroundColor:
							dataset.events[showEventTooltip].accentHue > -1
								? `hsl(${dataset.events[showEventTooltip].accentHue}deg 20% 18%)`
								: "",
						borderColor:
							dataset.events[showEventTooltip].accentHue > -1
								? `hsl(${dataset.events[showEventTooltip].accentHue}deg 20% 45%)`
								: "",
					}}
					onMouseMove={canvasMouseMove}>
					<h2>{dataset.events[showEventTooltip].title}</h2>
					<p>
						{parseDate(dataset.events[showEventTooltip].date)}
						{dataset.events[showEventTooltip].time
							? " at " + dataset.events[showEventTooltip].time.toString()
							: ""}
					</p>
					<p
						className="tooltipNotes"
						style={{ color: dataset.events[showEventTooltip].notes ? "#fffa" : "#fff8" }}>
						{dataset.events[showEventTooltip].notes || "No notes"}
					</p>
				</div>
			)}

			{showRangeTooltip > 0 && (
				<div
					className="tooltip"
					style={{
						transform: `translateX(${Math.min(mousePos[0], width - 430)}px) translateY(${Math.min(
							mousePos[1],
							height - 280
						)}px)`,
						backgroundColor: tooltipRange.accentHue > -1 ? `hsl(${tooltipRange.accentHue}deg 20% 18%)` : "",
						borderColor: tooltipRange.accentHue > -1 ? `hsl(${tooltipRange.accentHue}deg 20% 45%)` : "",
					}}
					onMouseMove={canvasMouseMove}>
					<h2>{tooltipRange.title}</h2>
					<p>
						{parseRangeDate(tooltipRange.fromDate, tooltipRange.fromRelative)} to{" "}
						{parseRangeDate(tooltipRange.toDate, tooltipRange.toRelative)}
					</p>
					<p
						className="tooltipNotes"
						style={{
							color: tooltipRange.notes ? "#fffa" : "#fff8",
							WebkitLineClamp: "4",
						}}>
						{tooltipRange.notes || "No notes"}
					</p>
				</div>
			)}
		</div>
	);
}

export default TimelineView;
