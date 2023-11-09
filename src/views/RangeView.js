import "./RangeView.css";
import { parseRangeDate, parseRangeTitle, sortRangesAsIDs } from "../functions";

function RangeView({ ranges, editRange, setEditRange }) {
	if (Object.keys(ranges).length === 0)
		return (
			<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
				<h2 style={{ color: "#fff8" }}>No ranges</h2>
			</div>
		);

	return (
		<div className="view rangeView">
			{sortRangesAsIDs(ranges).map((range_id) => {
				const range = ranges[range_id];
				return (
					<p
						key={range_id}
						className={`range ${editRange === range_id ? "rangeEditing" : ""}`}
						title={`${parseRangeTitle(
							range.fromDate,
							range.fromTime,
							range.fromRelative
						)} to ${parseRangeTitle(range.toDate, range.toTime, range.toRelative)}`}
						onClick={() => setEditRange(editRange !== range_id ? range_id : -1)}>
						{range.title}: {parseRangeDate(range.fromDate, range.fromRelative)} to{" "}
						{parseRangeDate(range.toDate, range.toRelative)}
					</p>
				);
			})}
		</div>
	);
}

export default RangeView;
