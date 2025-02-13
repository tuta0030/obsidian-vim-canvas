import { App, Plugin, Canvas } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { vimCanvasNavigate} from "./vimCanvasNavigate";


export default class VimCanvas extends Plugin {
	app: App;

	async onload() {
		vimCommandPalette(this.app);
		this.app.workspace.onLayoutReady(() => {
			vimCanvasNavigate(this.app);
		});
	}

	onunload() {}
}
