import { App, Canvas, CanvasNode } from "obsidian";

// Select next node
export const selectNextNode = (canvas:Canvas , nextNode: CanvasNode | undefined, app: App) => {
	if (!nextNode) return;
	if (nextNode) {
		canvas.selectOnly(nextNode);
		canvas.zoomToSelection();
	}
};

export const selectNextNodeAndCurrent = (
	canvas: Canvas,
	nextNode: CanvasNode | undefined,
	app: App
) => {
	if (!nextNode) {
		return;
	}
	if (nextNode) {
		canvas.select(nextNode);
		canvas.zoomToSelection();
		return nextNode;
	}
};