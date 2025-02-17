import {Canvas, CanvasNode} from "obsidian";

export async function selectAndZoom(canvas: Canvas, node: CanvasNode, deselect = true) {
	deselect && canvas.deselectAll();

	// 等待节点完成初始化
	await new Promise((resolve) => {
		const checkNode = () => {
			if (node.width > 0 && node.height > 0) {
				resolve(true);
			} else {
				requestAnimationFrame(checkNode);
			}
		};
		checkNode();
	});

	canvas.select(node);

	// 安全缩放
	try {
		canvas.zoomToSelection();
	} catch (e) {
		console.warn("Zoom failed, fallback to frame", e);
		canvas.requestFrame();
	}
}