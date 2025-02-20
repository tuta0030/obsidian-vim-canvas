import { App, CanvasNode } from "obsidian";
import { getCanvas } from "./vimCanvasGetCanvas";
import { createEdgeForNode } from "./vimCanvasCreateEdge";

// function to create a node
export async function createNode(
	app: App,
	lastNode: CanvasNode[],
	below = true,
	above = false,
	{ x = 100, y = 100 }: { x?: number; y?: number } = {},
	{ width = 200, height = 50 }: { width?: number; height?: number } = {}
) {
	const gap = { x, y };
	const canvas = getCanvas(app);

	if (!canvas) {
		console.error("Canvas not found");
		return null;
	}

	const currentSelection = canvas.selection;
	const allNodes = canvas.nodes;

	// 如果没有选中节点，并且没有节点，则创建一个默认节点
	if (currentSelection.size === 0 && allNodes.size === 0) {
		const newNode = await new Promise<CanvasNode | null>((resolve) => {
			requestAnimationFrame(async () => {
				try {
					// @ts-ignore
					const node = canvas.createTextNode({
						pos: { x, y },
						text: "",
						size: { width, height },
					});
					await new Promise((r) => setTimeout(r, 50)); // 等待节点初始化
					resolve(node);
				} catch (e) {
					console.error("Node creation failed", e);
					resolve(null);
				}
			});
		});
		return newNode;
	}

	// 如果选中了节点，则根据 below 的值创建节点
	else if (currentSelection.size === 1) {
		const firstInSelection = Array.from(currentSelection.entries()).flat()[0];
		if (!firstInSelection) return null;

		async function _createTextNode(x: number, y: number) {
			try {
				// @ts-ignore
				const newNode = canvas.createTextNode({
					pos: { x, y },
					text: "",
					size: { width: firstInSelection.width, height: firstInSelection.height },
				});

				if (!canvas) return;
				canvas.deselectAll();
				canvas.select(newNode);

				if (!newNode?.id) {
					console.error("Node creation failed");
					return null;
				}

				await createEdgeForNode(canvas, firstInSelection, newNode, below, above);
				return newNode;
			} catch (e) {
				console.error("Node creation failed", e);
				return null;
			}
		}

		let newX, newY;
		if (below) {
			newX = firstInSelection.x;
			newY = firstInSelection.y + firstInSelection.height + gap.y;
		} else if (above) {
			newX = firstInSelection.x;
			newY = firstInSelection.y - (firstInSelection.height + gap.y);
		} else {
			newX = firstInSelection.x + firstInSelection.width + gap.x;
			newY = firstInSelection.y;
		}

		const newNode = await _createTextNode(newX, newY);
		if (newNode) canvas.requestSave();
		return newNode;
	}

	// 处理其他情况
	if (currentSelection.size === 0 && allNodes.size !== 0) {
		console.warn("No nodes selected but there are existing nodes.");
		return null;
	}

	return null;
}