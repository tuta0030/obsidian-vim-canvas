import { error } from "console";
import { App} from "obsidian";
import { getCanvas } from "./vimCanvasGetCanvas";

// function to create a node
export function createNode(
	app: App,
	{ x = 0, y = 0 }: { x?: number; y?: number } = {},
	{ width = 300, height = 200 }: { width?: number; height?: number } = {}
) {
	const gap = { x, y };
	const nodeSize = { width, height };
	const canvas = getCanvas(app);

	if (!canvas) {
		error("Canvas not found");
		return;
	}

	const currentSelection = canvas.selection;
	if (currentSelection.size === 0) {
		// @ts-ignore
		canvas.createTextNode({
			pos: { x: 0, y: 0 }, // 设置初始坐标
			text: "", // 节点默认文本
			size: {
				width: (nodeSize.width = 200),
				height: (nodeSize.height = 100),
			}, // 设置默认尺寸
		});
	} else if (currentSelection.size !== 0) {
		const firstInSelection = currentSelection.entries().next().value.first();
		const x = firstInSelection.x + gap.x;
		const y = firstInSelection.y + gap.y;
		// @ts-ignore
		canvas.createTextNode({
			pos: { x: x, y: y }, // 设置初始坐标
			text: "", // 节点默认文本
			size: { width: nodeSize.width, height: nodeSize.height }, // 设置默认尺寸
		});
	}
}