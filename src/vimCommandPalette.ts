import { App } from "obsidian";

export const vimCommandPalette = (app: App) => {
		document.addEventListener("keydown", (e) => {
			const isKeyRelevantValues = isKeyRelevant(
				e,
				//@ts-ignore
				app.workspace.editorSuggest.currentSuggest
			);
			if (isKeyRelevantValues) {
				const key = isKeyRelevantValues.key;
				// console.log(key);
				switch (key) {
					case "j":
						e.preventDefault();
						document.dispatchEvent(
							new KeyboardEvent("keydown", {
								key: "ArrowDown",
								code: "ArrowDown",
							})
						);
						break;
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
	}

function isKeyRelevant(
	// document: HTMLDocument,
	event: KeyboardEvent,
	isSuggesting: boolean
) {
	if (!document.activeElement || !event.ctrlKey) {
		return false;
	}

	const el = document.activeElement;
	const isInOmniSearch = el.closest(".omnisearch-modal");
	const isInAutoCompleteFile = el.closest(".cm-content");
	// The OmniSearch plugin already maps Ctrl-J and Ctrl-K
	return (
		(!isInOmniSearch && el.hasClass("prompt-input")) ||
			isInAutoCompleteFile ||
			isSuggesting,
		event
	);
}