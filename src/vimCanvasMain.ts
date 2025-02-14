import { error, log } from "console";
import { App, Canvas, CanvasNode} from "obsidian";
import { getCanvas} from "./vimCanvasGetCanvas"
import { createNode } from "./vimCanvasCreateNode";

// function to navigate between nodes
// function to select nodes
// function to refocus on node
export function refocusNode(app: App) {
	const canvas = getCanvas(app);

	if (!canvas) {
		return error("Canvas not found");
	}

	const viewPortFirstNode = canvas.getViewportNodes().first();

	if (!viewPortFirstNode) {
		return error("No nodes found");
	}

	canvas.select(viewPortFirstNode);
}
// function to zoom canvas

// setup all shortcuts
function setupShortcuts() {

}


export function vimCanvasMain(app: App) {
        try {
			console.log("Load vimCanvasNavigate");
			// console.log(createNode(app))
			refocusNode(app);
		} catch (error) {
			console.error("Vim canvas navigate failed:", error);
		}

}
