import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import VimCanvas from "./vimCanvas";

export class VimCanvasSettingTab extends PluginSettingTab {
	Plugin: VimCanvas;

	constructor(app: App, plugin: VimCanvas) {
		super(app, plugin);
		this.Plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Navigation Keys")
			.setDesc("Use these keys to navigate the canvas nodes")
			.addText((text) => {
				text.setPlaceholder("h, j, k, l")
					.setValue(this.Plugin.settings.hjklList.join(","))
					.onChange(async (value) => {
						this.Plugin.settings.hjklList = value
							.split(",")
							.map((k) => k.trim());
						await this.Plugin.saveSettings();
					});
			});
	}
}