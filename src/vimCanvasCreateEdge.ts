import { CanvasNode, CanvasEdge, Canvas} from "obsidian";
import {CanvasNodeData} from "obsidian/canvas";
import {random} from "./vimCanvasRandomId"

interface edgeT {
	fromOrTo: string;
	side: string,
	node: CanvasNode | CanvasNodeData,
}

export const addEdge = (canvas: any, edgeID: string, fromEdge: edgeT, toEdge: edgeT) => {
	if (!canvas) return;

	const data = canvas.getData();
	if (!data) return;

	canvas.importData({
		"edges": [
			...data.edges,
			{
				"id": edgeID,
				"fromNode": fromEdge.node.id,
				"fromSide": fromEdge.side,
				"toNode": toEdge.node.id,
				"toSide": toEdge.side
			}
		],
		"nodes": data.nodes,
	});

	canvas.requestFrame();
};

export function createEdgeForNode(canvas:Canvas, from:CanvasNode, to:any, direction: any) {
    // console.log("createEdgeForNode: ", "from: "+from.id, "to: "+to.id);
	switch (direction) {
        case "down":
			addEdge(canvas, random(16), 
			{fromOrTo:from.id, side: "right", node: from},
			{fromOrTo: to.id, side: "left", node: to})
            break;
        case "up":
			addEdge(canvas, random(16), 
			{fromOrTo:from.id, side: "top", node: from},
			{fromOrTo: to.id, side: "bottom", node: to})
            break;
        case "right":
			addEdge(canvas, random(16), 
			{fromOrTo:from.id, side: "bottom", node: from},
			{fromOrTo: to.id, side: "top", node: to})
            break;
        case "left":
			addEdge(canvas, random(16), 
			{fromOrTo:from.id, side: "left", node: from},
			{fromOrTo: to.id, side: "right", node: to})
            break;
    }
}
