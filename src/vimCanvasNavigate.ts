import { log } from "console";
import { App} from "obsidian";

// get current tab
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
// define what is a node
function Node() {

}
// define what is a link

// function to create a node
// function to navigate between nodes
// function to select nodes
// function to refocus on node
// function to zoom canvas


export function vimCanvasNavigate(app: App) {
        try {
			console.log("Load vimCanvasNavigate");
			console.log("Canvas status:",isCanvas(app));
			console.log("Vim status:",isVimEnabled(app));
		} catch (error) {
			console.error("Vim canvas navigate failed:", error);
		}

}
