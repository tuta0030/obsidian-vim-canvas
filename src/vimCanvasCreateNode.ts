import { App, CanvasNode } from "obsidian";
import { getValidCanvas } from "./vimCanvasGetCanvas";
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
	const canvas = getValidCanvas(app, lastNode);

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


// import { App, CanvasNode, Modifier} from "obsidian";
// import { error } from "console";
// import { getValidCanvas } from "./vimCanvasGetCanvas";
// import { createEdgeForNode } from "./vimCanvasCreateEdge"
// import { selectAndZoom } from "./vimCanvasSelectAndZoom";

// // function to create a node
// export async function createNode(
// 	app: App,
// 	below = true,
// 	above = false,
// 	{ x = 100, y = 100 }: { x?: number; y?: number } = {},
// 	{ width = 200, height = 50 }: { width?: number; height?: number } = {}
// ) {
// 	const gap = { x: x, y: y };
// 	const nodeSize = { width, height };
// 	const canvas = getValidCanvas();

// 	if (!canvas) {
// 		error("Canvas not found");
// 		return;
// 	}

// 	const currentSelection = canvas.selection;
// 	const allNodes = canvas.nodes;
// 	// 如果没有选中节点，并且没有节点，则创建一个默认节点
// 	if (currentSelection.size === 0 && allNodes.size === 0) {
// 		// @ts-ignore
// 		const newNode = await new Promise<CanvasNode>((resolve) => {
// 			requestAnimationFrame(() => {
// 				// @ts-ignore
// 				const node = canvas.createTextNode({
// 					pos: { x, y },
// 					text: "",
// 					size: { width, height },
// 				});
// 				// 等待节点初始化
// 				setTimeout(() => resolve(node), 50);
// 			});
// 		});
// 		return newNode;
// 	}
// 	// 如果选中了节点，则根据 below 的值创建节点
// 	else if (currentSelection.size === 1) {
// 		const firstInSelection = currentSelection
// 			.entries()
// 			.next()
// 			.value.first();
// 		function _createTextNode(x: number, y: number) {
// 			// @ts-ignore
// 			const newNode = canvas.createTextNode({
// 				pos: { x: x, y: y },
// 				text: "",
// 				size: {
// 					width: firstInSelection.width,
// 					height: firstInSelection.height,
// 				}, // 设置默认尺寸
// 			});

// 			if (!canvas) return;
// 			canvas.deselectAll();
// 			canvas.select(newNode);

// 			if (!canvas) return;

// 			// 添加边之前验证节点
// 			if (!newNode?.id) {
// 				console.error("Node creation failed");
// 				return;
// 			}
// 			// 添加边操作也需要异步处理
// 			requestAnimationFrame(() => {
// 				createEdgeForNode(
// 					canvas,
// 					firstInSelection,
// 					newNode,
// 					below,
// 					above
// 				);
// 			});
// 			return newNode;
// 		}

// 		if (below) {
// 			const x = firstInSelection.x;
// 			const y = firstInSelection.y + firstInSelection.height + gap.y;
// 			_createTextNode(x, y);
// 			canvas.requestSave();
// 		} else if (above) {
// 			const x = firstInSelection.x;
// 			const y = firstInSelection.y - (firstInSelection.height + gap.y);
// 			_createTextNode(x, y);
// 			canvas.requestSave();
// 		} else {
// 			const x = firstInSelection.x + firstInSelection.width + gap.x;
// 			const y = firstInSelection.y;
// 			_createTextNode(x, y);
// 			canvas.requestSave();
// 		}
// 	}
// }

// export function createCreateNodeCommand(
// 	key: "tab" | "enter",
// 	useDeselect: boolean,
// 	modifiers: Modifier[] = []
// ) {
// 	const sortedModifiers = [...modifiers].sort() as Modifier[];
// 	const keyCombo = modifiers.toString().toLowerCase() + key.toLowerCase();
// 	this.addCommand({
// 		id: `create-node-${sortedModifiers.join("-")}-${key}`,
// 		name: `Create Node ${key.toUpperCase()}${
// 			useDeselect ? "" : " (multi)"
// 		}`,
// 		callback: async () => {
// 			if (this.isEditing()) return;
// 			// console.log(`current key is ${keyCombo}`);
// 			const canvas = getValidCanvas();
// 			if (!canvas) return;
// 			const currentNode = this.lastNode.at(-1);
// 			if (!canvas || !currentNode) return;
// 			// @ts-ignore
// 			if (currentNode.isEditing) return;

// 			switch (keyCombo) {
// 				case "enter":
// 					const newNodeBelow = await createNode(this.app);
// 					if (!newNodeBelow) return;
// 					canvas.deselectAll();
// 					await selectAndZoom(canvas, newNodeBelow, true);
// 					this.addToHistory(newNodeBelow);
// 					break;

// 				case "tab":
// 					const newNodeSide = await createNode(this.app, false);
// 					if (!newNodeSide) return;
// 					canvas.deselectAll();
// 					await selectAndZoom(canvas, newNodeSide, true);
// 					this.addToHistory(newNodeSide);
// 					break;

// 				case "shiftenter":
// 					const newNodeAbove = await createNode(
// 						this.app,
// 						false,
// 						true
// 					);
// 					if (!newNodeAbove) return;
// 					canvas.deselectAll();
// 					await selectAndZoom(canvas, newNodeAbove, true);
// 					this.addToHistory(newNodeAbove);
// 					break;

// 				default:
// 					break;
// 			}
// 		},
// 		hotkeys: [{ modifiers: sortedModifiers, key }],
// 	});
// }