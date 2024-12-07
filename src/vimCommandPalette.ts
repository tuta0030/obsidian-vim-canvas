import {
	App,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: "default",
// };

function isKeyRelevant(
	document: HTMLDocument,
	event: KeyboardEvent,
	isSuggesting: boolean
) {
	if (!document.activeElement || !event.ctrlKey) {
		return false;
	}
	const el = document.activeElement;
	const isInOmniSearch = el.closest(".omnisearch-modal");
	const isInAutoCompleteFile = el.closest(".cm-content");
	// The OmniSearch plugin already maps Ctrl-J and Ctrl-K and we don't want to duplicate the
	// effort and jump twice.
	return (
		(!isInOmniSearch && el.hasClass("prompt-input")) ||
		isInAutoCompleteFile ||
		isSuggesting
	);
}
const vimCommandPaletteKeyMap = (app: App)=> {
		document.addEventListener("keydown", (e) => {
			if (
				(isKeyRelevant(document, e) && e.code == "KeyJ",
				app.workspace.editorSuggest.currentSuggest)
			) {
				e.preventDefault();
				document.dispatchEvent(
					new KeyboardEvent("keydown", {
						key: "ArrowDown",
						code: "ArrowDown",
					})
				);
			}
		});
		document.addEventListener("keydown", (e) => {
			if (
				(isKeyRelevant(document, e) && e.code == "KeyK",
				app.workspace.editorSuggest.currentSuggest)
			) {
				e.preventDefault();
				document.dispatchEvent(
					new KeyboardEvent("keydown", {
						key: "ArrowUp",
						code: "ArrowUp",
					})
				);
			}
}


// export default class vimCommandPalette extends Plugin {
// 	// settings: MyPluginSettings;

// 	async onload() {
// 		});
// 	}

// 	onunload() {}

	// async loadSettings() {
	// 	this.settings = Object.assign(
	// 		{},
	// 		DEFAULT_SETTINGS,
	// 		await this.loadData()
	// 	);
	// }

	// async saveSettings() {
	// 	await this.saveData(this.settings);
	// }
// }

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: vimCommandPalette;

	constructor(app: App, plugin: vimCommandPalette) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "vim command palette settings" });

		// new Setting(containerEl)
		// 	.setName("Setting #1")
		// 	.setDesc("It's a secret")
		// 	.addText((text) =>
		// 		text
		// 			.setPlaceholder("Enter your secret")
		// 			.setValue(this.plugin.settings.mySetting)
		// 			.onChange(async (value) => {
		// 				console.log("Secret: " + value);
		// 				this.plugin.settings.mySetting = value;
		// 				await this.plugin.saveSettings();
		// 			})
		// 	);
	}
}
