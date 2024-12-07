import { CanvasNode, Canvas  } from "obsidian";

export const navigateNode = (lastNode: CanvasNode,canvas: Canvas, direction: "h" | "j" | "k" | "l") => {
	let lastNodeSet: Set<CanvasNode> = new Set();
	if (lastNode) {
		lastNodeSet.add(lastNode);
	}
	let currentSelection = lastNode ? lastNodeSet : canvas.selection;

	// Check if the selected node is editing
	if (currentSelection.values().next().value.isEditing) return;

	const selectedItem =
		currentSelection instanceof Set
			? (currentSelection.values().next().value as CanvasNode)
			: currentSelection;
	const allTheNodes = canvas.nodes;
	const viewportNodes = canvas.getViewportNodes();

	const { x, y } = selectedItem;

	// Define direction vectors
	const directionVectors = {
		h: { dx: -1, dy: 0 }, // left
		j: { dx: 0, dy: 1 }, // down
		k: { dx: 0, dy: -1 }, // up
		l: { dx: 1, dy: 0 }, // right
	};

	const targetVector = directionVectors[direction];
	if (!targetVector) return;

	// Calculate the target angle in degrees
	const targetAngle =
		Math.atan2(targetVector.dy, targetVector.dx) * (180 / Math.PI);

	// Helper function to calculate angle difference considering 360 degree wrap-around
	const calculateAngleDifference = (angle1: number, angle2: number) => {
		let diff = Math.abs(angle1 - angle2);
		if (diff > 180) {
			diff = 360 - diff;
		}
		return diff;
	};

	// Calculate distances and angles for all nodes
	const nodesWithDistances = Array.from(allTheNodes.values())
		.map((node) => {
			const nx = node.x;
			const ny = node.y;
			const dx = nx - x;
			const dy = ny - y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Determine if the node is in the desired direction
			let isInDirection = false;
			switch (direction) {
				case "h": // left
					isInDirection = dx < 0;
					break;
				case "j": // down
					isInDirection = dy > 0;
					break;
				case "k": // up
					isInDirection = dy < 0;
					break;
				case "l": // right
					isInDirection = dx > 0;
					break;
			}

			const angle = Math.atan2(dy, dx) * (180 / Math.PI);
			const angleDifference = calculateAngleDifference(
				angle,
				targetAngle
			);

			return { node, distance, isInDirection, angleDifference };
		})
		.filter(
			(item) => item.node.id !== selectedItem.id && item.isInDirection
		);

	// First, filter nodes within 6 degrees and in viewportNodes
	const nodesWithin6Degrees = nodesWithDistances.filter(
		(item) =>
			item.angleDifference <= 3 &&
			viewportNodes.includes(item.node) &&
			(direction === "h" || direction === "l")
	);

	// If there are nodes within 6 degrees, and nodes in viewportNodes, sort them by distance and select the closest one
	if (nodesWithin6Degrees.length > 0) {
		nodesWithin6Degrees.sort((a, b) => a.distance - b.distance);
		const nextNode = nodesWithin6Degrees[0].node;
		lastNode = nextNode;
		return nextNode;
	}

	// If no nodes within 6 degrees, filter nodes within 60 degrees and select the closest one
	const nodesWithin60Degrees = nodesWithDistances.filter(
		(item) => item.angleDifference <= 60
	);
	if (nodesWithin60Degrees.length > 0) {
		nodesWithin60Degrees.sort((a, b) => a.distance - b.distance);
		const nextNode = nodesWithin60Degrees[0].node;
		lastNode = nextNode;
		return nextNode;
	}
};