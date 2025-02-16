import { CanvasNode, CanvasEdge, Canvas} from "obsidian";
import {CanvasNodeData} from "obsidian/canvas";

interface edgeT {
	fromOrTo: string;
	side: string,
	node: CanvasNode | CanvasNodeData,
}

export const random = (e: number) => {
	let t = [];
	for (let n = 0; n < e; n++) {
		t.push((16 * Math.random() | 0).toString(16));
	}
	return t.join("");
};


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

export function createEdgeForNode(canvas:Canvas, from:CanvasNode, to:CanvasNode, below=false, above=false) {
    // console.log("createEdgeForNode: ", "from: "+from.id, "to: "+to.id);
    if (below) {
        addEdge(canvas, random(16), 
        {fromOrTo:from.id, side: "bottom", node: from},
        {fromOrTo: to.id, side: "top", node: to})
    } else if (above){
        addEdge(canvas, random(16), 
        {fromOrTo:from.id, side: "top", node: from},
        {fromOrTo: to.id, side: "bottom", node: to})
	}
	else {
        addEdge(canvas, random(16), 
        {fromOrTo:from.id, side: "right", node: from},
        {fromOrTo: to.id, side: "left", node: to})
    }
}
