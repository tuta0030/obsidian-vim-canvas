import { App } from "obsidian";

export const vimCommandPalette = (app: App) => {
	console.log("Load vimCommandPalette");
	document.addEventListener("keydown", (e) => {
		const isKeyRelevantValues = isKeyRelevant(e, app);
		if (isKeyRelevantValues) {
			const key = isKeyRelevantValues.key;
			// if match the key, dispatch the arrow down event
			switch (key) {
				case "n":
				case "j":
					e.preventDefault();
					document.dispatchEvent(
						new KeyboardEvent("keydown", {
							key: "ArrowDown",
							code: "ArrowDown",
						})
					);
					break;
				case "p":
				case "k":
					e.preventDefault();
					document.dispatchEvent(
						new KeyboardEvent("keydown", {
							key: "ArrowUp",
							code: "ArrowUp",
						})
					);
					break;
			}
		}
	});
};

function isKeyRelevant(event: KeyboardEvent, app: App): KeyboardEvent | false | undefined {
	if (!document.activeElement || !event.ctrlKey) {
		return false;
	}

	const el = document.activeElement;
	const isInOmniSearch = el.closest(".omnisearch-modal");
	const isInAutoCompleteFile = el.closest(".cm-content");
	// The OmniSearch plugin already maps Ctrl-J and Ctrl-K

	// check all the conditions here
	if (
		(!isInOmniSearch && el.hasClass("prompt-input")) ||
		isInAutoCompleteFile ||
		// @ts-ignore
		app.workspace.editorSuggest.currentSuggest ||
		app.workspace.activeLeaf?.getViewState().type == "search" ||
		app.workspace.activeLeaf?.getViewState().type == "outline"||
		app.workspace.activeLeaf?.getViewState().type == "file-explorer" ||
		app.workspace.activeLeaf?.getViewState().type == "backlink"||
		app.workspace.activeLeaf?.getViewState().type == "outgoing-link"||
		app.workspace.activeLeaf?.getViewState().type == "tag"||
		app.workspace.activeLeaf?.getViewState().type == "bookmarks"

	) {
		return event;
	}
}
