import "./RangeView.css";
import { parseRangeDate, parseRangeTitle, parseRangesToCategories, sortRangesAsIDs } from "../functions";
import { useState } from "react";

function RangeView({ data, currentDataset, ranges, editRange, setEditRange }) {
	const [splitIntoCategories, setSplitIntoCategories] = useState(true);
	let parsedRangesInCategories = parseRangesToCategories(ranges);

	const createRangeEntry = (range_id) => {
		const range = ranges[range_id];
		return (
			<p
				key={range_id}
				className={`range ${editRange === range_id ? "rangeEditing" : ""}`}
				title={`${parseRangeTitle(range.fromDate, range.fromTime, range.fromRelative)} to ${parseRangeTitle(
					range.toDate,
					range.toTime,
					range.toRelative
				)}`}
				onClick={() => setEditRange(editRange !== range_id ? range_id : -1)}>
				{range.title}: {parseRangeDate(range.fromDate, range.fromRelative)} to{" "}
				{parseRangeDate(range.toDate, range.toRelative)}
			</p>
		);
	};

	if (Object.keys(ranges).length === 0)
		return (
			<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
				<h2 style={{ color: "#fff8" }}>No ranges</h2>
			</div>
		);

	return (
		<div className="view rangeView">
			<div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
				<p style={{ fontStyle: "italic" }}>Split into categories</p>
				<input
					type="checkbox"
					checked={splitIntoCategories}
					onChange={() => setSplitIntoCategories(!splitIntoCategories)}
				/>
			</div>

			{splitIntoCategories
				? [-1].concat(Object.keys(data.datasets[currentDataset].categories ?? {})).map((category_id) => {
						if (!Object.keys(parsedRangesInCategories).includes(category_id.toString()))
							return null;

						return (
							<div key={category_id}>
								{category_id > -1 && (
									<h2 style={{ marginTop: 10 }}>
										{data.datasets[currentDataset].categories[category_id].name}
									</h2>
								)}
								{sortRangesAsIDs(
									parsedRangesInCategories[category_id].reduce(
										(acc, cur) => ({ ...acc, [cur]: ranges[cur] }),
										{}
									)
								).map((range_id) => createRangeEntry(range_id))}
							</div>
						);
				  })
				: sortRangesAsIDs(ranges).map((range_id) => createRangeEntry(range_id))}
		</div>
	);
}

export default RangeView;
