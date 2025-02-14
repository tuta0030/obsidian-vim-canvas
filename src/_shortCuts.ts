import { Canvas, CanvasNode} from "obsidian";

export const hjklNavigate = (canvas: Canvas, selectNode: Function, navigateNode: Function, direction: "h" | "j" | "k" | "l") => {
	const currentSelection = canvas.selection;
	if (!currentSelection.isEditing) {
		selectNode(navigateNode(canvas, direction));
	}
};

export const hjklMoveNode = (canvas: Canvas, direction: "h" | "j" | "k" | "l") => {
	let node = canvas.selection;
	switch (direction) {
		case "h":
			node.forEach((node: CanvasNode) => {
				node.x -= 10;
				node.moveTo(node);
			});
			break;
		case "j":
			node.forEach((node: CanvasNode) => {
				node.y += 10;
				node.moveTo(node);
			});
			break;
		case "k":
			node.forEach((node: CanvasNode) => {
				node.y -= 10;
				node.moveTo(node);
			});
		case "l":
			node.forEach((node: CanvasNode) => {
				node.x += 10;
				node.moveTo(node);
			});
	}

};
