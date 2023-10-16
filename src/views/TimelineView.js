import { useState, useEffect, useRef, useCallback } from "react";
import "./TimelineView.css";
import { DAY, YEAR, monthNames, useWindowSize } from "../functions";

function renderTimeline(dataset, canvas, start, viewRange, width, timestampToGraph) {
	console.log("Rendering...");
	const context = canvas.getContext("2d");

	// Scale canvas for clarity
	context.scale(window.devicePixelRatio, window.devicePixelRatio);

	// Clear canvas
	context.beginPath();
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Draw events
	const drawEvent = (timestamp, y = 100) => {
		context.beginPath();
		context.arc(timestampToGraph(timestamp), y || 100, 5, 0, 2 * Math.PI);
		context.fillStyle = "white";
		context.fill();
	};
	let eventDatesDisplayed = {};
	Object.keys(dataset?.events ?? {}).forEach((event_id) => {
		const event = dataset.events[event_id];
		let date;
		if (event.time)
			date = new Date(
				event.date.slice(6),
				+event.date.slice(0, 2) - 1,
				event.date.slice(3, 5),
				+event.time.slice(0, 2) + (event.time[8] === "p" ? 12 : 0),
				event.time.slice(3, 5),
				event.time.slice(6, 8)
			);
		else date = new Date(event.date.slice(6), +event.date.slice(0, 2) - 1, event.date.slice(3, 5));

		if (Object.keys(eventDatesDisplayed).includes(date.getTime().toString())) {
			drawEvent(date.getTime(), 100 + eventDatesDisplayed[date.getTime()] * 15);
			eventDatesDisplayed[date.getTime()]++;
		} else {
			drawEvent(date.getTime());
			eventDatesDisplayed[date.getTime()] = 1;
		}
	});

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
	const msPerPixel = viewRange / width;
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

	// Reset canvas scaling
	context.scale(0.5, 0.5);
}

function TimelineView({ dataset }) {
	// Event states
	const [width, height] = useWindowSize();
	const [mousePos, setMousePos] = useState([0, 0]);
	const [mouseDown, setMouseDown] = useState(false);

	// Canvas states
	const canvasRef = useRef(null);
	const [start, setStart] = useState(Date.now() - YEAR * 0.25);
	const [viewRange, setViewRange] = useState(YEAR / 2);

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
		const newY = e.clientY - 49;
		if (mouseDown) {
			setStart(graphToTimestamp(timestampToGraph(start) - newX + mousePos[0]));
		}
		setMousePos([newX, newY]);
	};

	// Rendering
	useEffect(() => {
		if (width > 0) renderTimeline(dataset, canvasRef.current, start, viewRange, width, timestampToGraph);
	}, [dataset, canvasRef, start, viewRange, width, timestampToGraph]);

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
		</div>
	);
}

export default TimelineView;
