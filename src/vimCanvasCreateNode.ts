import { App, CanvasNode, CanvasEdge} from "obsidian";
import { error } from "console";
import { getCanvas } from "./vimCanvasGetCanvas";
import { createEdgeForNode } from "./vimCanvasCreateEdge"

// function to create a node
export function createNode(
	app: App,
	below = true,
	lastNode: CanvasNode | undefined = undefined,
	{ x = 100, y = 100 }: { x?: number; y?: number } = {},
	{ width = 200, height = 50 }: { width?: number; height?: number } = {},
) {
	const gap = { x: x, y: y };
	const nodeSize = { width, height };
	const canvas = getCanvas(app);

	if (!canvas) {
		error("Canvas not found");
		return;
	}

	const currentSelection = canvas.selection;
	const allNodes = canvas.nodes;
	// 如果没有选中节点，并且没有节点，则创建一个默认节点
	if (currentSelection.size === 0 && allNodes.size === 0) {
		// @ts-ignore
		canvas.createTextNode({
			pos: { x: 0, y: 0 }, // 设置初始坐标
			text: "", // 节点默认文本
			size: {
				width: (nodeSize.width = 200),
				height: (nodeSize.height = 100),
			}, // 设置默认尺寸
		});
	} 
	// 如果选中了节点，则根据 below 的值创建节点
	else if (currentSelection.size === 1) {
		const firstInSelection = currentSelection.entries().next().value.first();
		function _createTextNode(x:number, y:number) {
			// @ts-ignore
			const newNode = canvas.createTextNode({
				pos: { x: x, y: y },
				text: "",
				size: { width: firstInSelection.width, height: firstInSelection.height }, // 设置默认尺寸
			});
			if (!canvas) return;
			// TODO: add edge for new nodes
			// createEdgeForNode(canvas, firstInSelection, newNode);
		}

		if (below) {
			const x = firstInSelection.x;
			const y = firstInSelection.y + firstInSelection.height + gap.y;
			_createTextNode(x, y);
		} else {
			const x = firstInSelection.x + firstInSelection.width + gap.x;
			const y = firstInSelection.y;
			_createTextNode(x, y);
		}
	}
}