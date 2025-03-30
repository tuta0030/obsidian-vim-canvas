import { error} from "console";
import { Canvas} from "obsidian";
import { CanvasNode } from "obsidian";

export function refocusNode(canvas: Canvas, isZoom = true, lastNodeList: any) {
	console.log(lastNodeList);

	if (lastNodeList.length > 0) {
		console.log("Last Node List is not empty");
		
		const lastNode = lastNodeList[lastNodeList.length-1]
		canvas.select(lastNode);
		if (isZoom) {
			canvas.zoomToSelection();
		}
		return lastNode;
	} else {
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
}