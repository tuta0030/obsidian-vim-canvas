import { App, Plugin, Canvas } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { vimCanvasMain, refocusNode} from "./vimCanvasMain";

console.log("Loading VimCanvas");

export default class VimCanvas extends Plugin {
	app: App;
	async onload() {

		// add commands
		// add refocus command
		this.addCommand({
			id: 'refocus-canvas-node',
			name: 'Refocus canvas node',
			callback: () => refocusNode(this.app),
			hotkeys: [
				{
					modifiers: [],
					key: "r"
				}
			]
		});
		// add navigate nodes command

		vimCommandPalette(this.app);
		this.app.workspace.onLayoutReady(() => {
			vimCanvasMain(this.app);
		});
	}

	onunload() {}
}
