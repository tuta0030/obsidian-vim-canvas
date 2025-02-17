import { CanvasNode } from "obsidian";

const MAX_HISTORY = 100;
export function addToHistory(node: CanvasNode, lastNode: CanvasNode[]):CanvasNode[] {
    if (lastNode.length >= MAX_HISTORY) {
        lastNode.shift();
    }
    lastNode.push(node);
    return lastNode;
}