import { error } from "console";
import { App, Canvas} from "obsidian";

// get canvas
// check if the current view is canvas
function isCanvas(app: App): boolean {
	return app.workspace.getActiveFile()?.extension === 'canvas';
}
// check if vim mode is enabled
function isVimEnabled(app: App): boolean {
	// @ts-ignore
	return app.vault.config.vimMode;
}
// if current view is canvs and vim mode is enabled
// start the vim canvas function
// get canvas object
export function getCanvas(app: App): Canvas | void {
	// console.log("Canvas status:",isCanvas(app));
	// console.log("Vim status:",isVimEnabled(app));
	if (isCanvas(app) && isVimEnabled(app)) {
		// @ts-ignore
		const canvas = app.workspace.getActiveFileView().canvas;
		return canvas;
	} else {
		return error("Canvas not found");
	}
}