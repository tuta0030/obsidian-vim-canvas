import { CanvasNode, CanvasEdge, Canvas} from "obsidian";

export function createEdgeForNode(canvas:Canvas, from:CanvasNode, to:CanvasNode) {
    // @ts-ignore
    canvas.addEdge({
        from: { node: from, side: "right" },
        to: { node: to, side: "left" },
    });
}
