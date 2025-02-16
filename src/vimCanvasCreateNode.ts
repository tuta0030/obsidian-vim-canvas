import { App, CanvasNode} from "obsidian";
import { error } from "console";
import { getCanvas } from "./vimCanvasGetCanvas";
import { createEdgeForNode } from "./vimCanvasCreateEdge"

// function to create a node
// FIXME: 创建节点后，不要立即进入编辑模式
export async function createNode(
	app: App,
	below = true,
	above = false,
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
		const newNode = await new Promise<CanvasNode>((resolve) => {
			requestAnimationFrame(() => {
				// @ts-ignore
				const node = canvas.createTextNode({
					pos: { x, y },
					text: "",
					size: { width, height },
				});
				// 等待节点初始化
				setTimeout(() => resolve(node), 50);
			});
		});
		return newNode;
	}
	// 如果选中了节点，则根据 below 的值创建节点
	else if (currentSelection.size === 1) {
		const firstInSelection = currentSelection
			.entries()
			.next()
			.value.first();
		function _createTextNode(x: number, y: number) {
			// @ts-ignore
			const newNode = canvas.createTextNode({
				pos: { x: x, y: y },
				text: "",
				size: {
					width: firstInSelection.width,
					height: firstInSelection.height,
				}, // 设置默认尺寸
			});

			// 强制退出编辑模式
			requestAnimationFrame(() => {
				if (newNode.isEditing) {
					// @ts-ignore
					newNode.exitEditing(); // Obsidian 私有 API
					newNode.setData({ content: "" }); // 清空内容防止残留
				}
			});

			if (!canvas) return;
			// 添加边之前验证节点
			if (!newNode?.id) {
				console.error("Node creation failed");
				return;
			}
			// 添加边操作也需要异步处理
			requestAnimationFrame(() => {
				createEdgeForNode(
					canvas,
					firstInSelection,
					newNode,
					below,
					above
				);
			});
			return newNode;
		}

		if (below) {
			const x = firstInSelection.x;
			const y = firstInSelection.y + firstInSelection.height + gap.y;
			_createTextNode(x, y);
			canvas.requestSave();
		} else if (above) {
			const x = firstInSelection.x;
			const y = firstInSelection.y - (firstInSelection.height + gap.y);
			_createTextNode(x, y);
			canvas.requestSave();
		} else {
			const x = firstInSelection.x + firstInSelection.width + gap.x;
			const y = firstInSelection.y;
			_createTextNode(x, y);
			canvas.requestSave();
		}
	}
}