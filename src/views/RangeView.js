import "./RangeView.css";
import { parseDate, sortRangesAsIDs } from "../functions";

function RangeView({ ranges }) {
	if (Object.keys(ranges).length === 0)
		return (
			<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
				<h2 style={{ color: "#fff8" }}>No ranges</h2>
			</div>
		);

	const parseRangeDate = (date, relative) => {
		return typeof date === "string"
			? (relative === "~" ? relative : relative ? relative + " " : "") + parseDate(date)
			: (relative ? relative[0] + " " : "≥ ") +
					parseDate(date[0]) +
					" & " +
					(relative ? relative[1] + " " : "≤ ") +
					parseDate(date[1]);
	};
	const parseRangeTitle = (date, time, relative) => {
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
	};

	return (
		<div className="view rangeView">
			{sortRangesAsIDs(ranges).map((range_id) => {
				const range = ranges[range_id];
				return (
					<p
						key={range_id}
						title={`${parseRangeTitle(
							range.fromDate,
							range.fromTime,
							range.fromRelative
						)} to ${parseRangeTitle(range.toDate, range.toTime, range.toRelative)}`}>
						{range.title}: {parseRangeDate(range.fromDate, range.fromRelative)} to{" "}
						{parseRangeDate(range.toDate, range.toRelative)}
					</p>
				);
			})}
		</div>
	);
}

export default RangeView;
