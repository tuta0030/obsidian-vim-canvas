import type { Canvas, CanvasEdge, CanvasNode } from "obsidian";
import type { CanvasEdgeData } from "obsidian/canvas";
import { addEdge, addNode, random } from "./utils";


export const createEdge = async (
	node1: CanvasNode,
	node2: any,
	canvas: Canvas
) => {
	addEdge(
		canvas,
		random(16),
		{
			fromOrTo: "from",
			side: "right",
			node: node1,
		},
		{
			fromOrTo: "to",
			side: "left",
			node: node2,
		}
	);
};

export const createFloatingNode = (canvas: any, direction: string) => {
	let selection = canvas.selection;

	if (selection.size !== 1) return;
	// Check if the selected node is editing
	if (selection.values().next().value.isEditing) return;

	let node = selection.values().next().value;
	let x =
		direction === "left"
			? node.x - node.width - 50
			: direction === "right"
			? node.x + node.width + 50
			: node.x;
	let y =
		direction === "top"
			? node.y - node.height - 100
			: direction === "bottom"
			? node.y + node.height + 100
			: node.y;

	const tempChildNode = addNode(canvas, random(16), {
		x: x,
		y: y,
		width: node.width,
		height: node.height,
		type: "text",
		content: "",
	});

	canvas?.requestSave();

	const currentNode = canvas.nodes?.get(tempChildNode?.id!);
	if (!currentNode) return;

	canvas.selectOnly(currentNode);
	canvas.zoomToSelection();

	setTimeout(() => {
		currentNode.startEditing();
	}, 100);

	return tempChildNode;
};

export const childNode = async (canvas: Canvas, parentNode: CanvasNode, y: number) => {
	let tempChildNode = addNode(canvas, random(16), {
		x: parentNode.x + parentNode.width + 200,
		y: y,
		width: parentNode.width,
		height: parentNode.height,
		type: "text",
		content: "",
	});

	await createEdge(parentNode, tempChildNode, canvas);

	canvas.deselectAll();
	const node = canvas.nodes?.get(tempChildNode?.id!);
	if (!node) return;
	canvas.selectOnly(node);

	canvas.requestSave();

	return tempChildNode;
};

export const createChildNode = async (canvas: Canvas, ignored: boolean) => {
	if (canvas.selection.size !== 1) return;
	const parentNode = canvas.selection.entries().next().value[1];

	if (parentNode.isEditing && !ignored) return;

	// Calculate the height of all the children nodes
	let wholeHeight = 0;
	let tempChildNode;
	const canvasData = canvas.getData();

	const prevParentEdges = canvasData.edges.filter((item: CanvasEdgeData) => {
		return item.fromNode === parentNode.id && item.toSide === "left";
	});

	if (prevParentEdges.length === 0) {
		tempChildNode = await childNode(canvas, parentNode, parentNode.y);
	} else {
		tempChildNode = await siblingNode(canvas, parentNode, prevParentEdges);
	}

	return tempChildNode;
};

export const siblingNode = async (
	canvas: Canvas,
	parentNode: CanvasNode,
	prevParentEdges: CanvasEdgeData[]
) => {
	const allEdges = canvas
		.getEdgesForNode(parentNode)
		.filter((item: CanvasEdge) => {
			return prevParentEdges.some((edge: CanvasEdgeData) => {
				return item.to.node.id === edge.toNode;
			});
		});

	const allNodes = allEdges.map((edge: CanvasEdge) => edge.to.node);
	allNodes.sort((a, b) => a.y - b.y);
	const lastNode = allNodes[allNodes.length - 1];
	canvas.selectOnly(lastNode);
	return await createSiblingNode(canvas, false);
};

export const createSiblingNode = async (canvas: Canvas, ignored: boolean) => {
	if (canvas.selection.size !== 1) return;
	const selectedNode = canvas.selection.entries().next().value[1];

	if (selectedNode.isEditing && !ignored) return;

	const incomingEdges = canvas
		.getEdgesForNode(selectedNode)
		.filter((edge: CanvasEdge) => edge.to.node.id === selectedNode.id);
	if (incomingEdges.length === 0) return;
	const parentNode = incomingEdges[0].from.node;

	const newYPosition = selectedNode.y + selectedNode.height / 2 + 110;
	const newChildNode = await childNode(canvas, parentNode, newYPosition);

	const leftSideEdges = canvas
		.getEdgesForNode(parentNode)
		.filter(
			(edge: CanvasEdge) =>
				edge.from.node.id === parentNode.id && edge.to.side === "left"
		);

	let nodes = leftSideEdges.map((edge: CanvasEdge) => edge.to.node);
	let totalHeight = nodes.reduce(
		(acc: number, node: CanvasNode) => acc + node.height + 20,
		0
	);

	nodes.sort((a, b) => a.y - b.y);

	if (nodes.length <= 1) return;
	if (nodes.length > 1 && nodes[0].x === nodes[1]?.x) {
		nodes.forEach((node: CanvasNode, index: number) => {
			const yPos =
				index === 0
					? parentNode.y + parentNode.height / 2 - totalHeight / 2
					: nodes[index - 1].y + nodes[index - 1].height + 20;
			node.moveTo({ x: selectedNode.x, y: yPos });
		});
	}

	canvas.requestSave();
	return newChildNode;
};