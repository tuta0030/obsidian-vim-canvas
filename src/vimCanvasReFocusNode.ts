import { error} from "console";
import { App} from "obsidian";
import { getCanvas} from "./vimCanvasGetCanvas"

export function refocusNode(app: App, isZoom = true) {
	const canvas = getCanvas(app);

	if (!canvas) {
		return error("Canvas not found");
	}

	const viewPortFirstNode = canvas.getViewportNodes().first();

	if (!viewPortFirstNode) {
		return error("No nodes found");
	}

	canvas.select(viewPortFirstNode);
	if (isZoom) {
		canvas.zoomToSelection();
	}
	return viewPortFirstNode;
}