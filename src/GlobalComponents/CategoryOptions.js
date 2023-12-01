import { useEffect, useState, useRef } from "react";
import "./OptionsModal.css";
import { db, auth } from "../App";
import { ref, set } from "firebase/database";

// Local Components
import SelectAccentHue from "./SelectAccentHue";

function CategoryOptions({ data, dataset, categoryID }) {
	const category = data.datasets[dataset]?.categories?.[categoryID];

	const prevCategoryID = useRef(categoryID);
	const [nameInput, setNameInput] = useState(category?.name ?? "");
	const [accentHue, setAccentHue] = useState(category?.accentHue ?? -1);

	useEffect(() => {
		if (prevCategoryID.current !== categoryID) {
			setNameInput(category?.name ?? "");
			setAccentHue(category?.accentHue ?? -1);
		}
		prevCategoryID.current = categoryID;
	}, [categoryID, category?.name, category?.accentHue]);

	if (!category) return null;

	return (
		<div style={{ padding: 12 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				<h1 style={{ fontSize: 24 }}>Category Settings</h1>
				{(category.name !== nameInput || +(category.accentHue ?? -1) !== +accentHue) && (
					<div
						className="optionsModalSaveChanges"
						style={{
							"--accent-hue": `${accentHue > -1 ? accentHue : 220}deg`,
						}}
						onClick={() => {
							const categoryURL = `timeline/users/${auth.currentUser.uid}/datasets/${dataset}/categories/${categoryID}/`;
							if (category.name !== nameInput) set(ref(db, categoryURL + "name"), nameInput);
							if (+category.accentHue !== +accentHue) set(ref(db, categoryURL + "accentHue"), accentHue);
						}}>
						<h1 style={{ fontSize: 16 }}>Save Changes</h1>
					</div>
				)}
			</div>
			<h1 style={{ fontSize: 18, marginTop: 15 }}>Name</h1>
			<input
				type="text"
				style={{ width: "calc(70% - 7px)", marginTop: 5 }}
				value={nameInput}
				onChange={(e) => setNameInput(e.target.value)}
				placeholder="Type category name here"
			/>
			<h1 style={{ fontSize: 18, marginTop: 15 }}>Color Accent</h1>
			<SelectAccentHue
				data={data}
				dataset={dataset}
				category={category}
				enabled={true}
				accentHue={accentHue}
				setAccentHue={setAccentHue}
			/>
		</div>
	);
}

export default CategoryOptions;
