import { App, CanvasNode, Canvas } from "obsidian";
import { createEdgeForNode } from "./vimCanvasCreateEdge";
import { CanvasData, CanvasFileData, CanvasTextData } from "obsidian/canvas";

// function to create a node
export async function createNode(
	app: App,
	canvas: Canvas,
	lastNodeList: CanvasNode[],
	currentNode: CanvasNode,
	id: string,
	type: "text" | "file" | undefined = "text",
	direction: "up"| "down"| "left"| "right",
	{ x = 100, y = 100 }: { x?: number; y?: number } = {},
	{ width = 200, height = 50 }: { width?: number; height?: number } = {}
): Promise<CanvasNode> {
	const gap = { x, y };
	const data = canvas.getData();

	const currentSelection = canvas.selection;
	const firstInSelection = Array.from(currentSelection.entries()).flat()[0];
	const allNodes = canvas.nodes;

	let newX: number, newY: number;

	switch (direction) {
		case "up":
			newX = firstInSelection.x;
			newY = firstInSelection.y - (firstInSelection.height + gap.y);
			break;
		case "down":
			newX = firstInSelection.x + (firstInSelection.width + gap.x);
			newY = firstInSelection.y;
			break;
		case "left":
			newX = firstInSelection.x - (firstInSelection.width + gap.x);
			newY = firstInSelection.y;
			break;
		case "right":
			newX = firstInSelection.x;
			newY = firstInSelection.y + (firstInSelection.height + gap.y);
			break;
	}

	async function _createTextNode(_x: number, _y: number) {
		try {
			const newNode: Partial<CanvasTextData | CanvasFileData> = {
				id: id,
				x: _x,
				y: _y,
				width: width,
				height: height,
				type: type,
			};

			canvas.importData(<CanvasData>{
				nodes: [...data.nodes, newNode],
			});

			if (!newNode?.id) {
				console.error(
					"Node creation failed, please provide a valid node id."
				);
				return null;
			}

			createEdgeForNode(canvas, firstInSelection, newNode, direction);
			return newNode;
		} catch (e) {
			console.error("Node creation failed", e);
		}
	}


	const newNode = await _createTextNode(newX, newY);
	if (newNode) canvas.requestSave();
	const _newNode = canvas.nodes.get(id);
	if (_newNode) return _newNode;
	throw new Error("Node creation failed")
}
