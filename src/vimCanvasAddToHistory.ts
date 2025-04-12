import { CanvasNode } from "obsidian";

const MAX_HISTORY = 100;
export function addToHistory(currentNode: CanvasNode, lastNode: CanvasNode[]):CanvasNode[] {
    if (lastNode.length >= MAX_HISTORY) {
        console.log("max history reached, make a shift...");
        lastNode.shift();
    }
    // console.log(`add ${currentNode} to history`);
    
    // if (lastNode.includes(currentNode)) {
    //     console.log(`${currentNode} already in history`);
    // }

    lastNode.push(currentNode);
    return lastNode;
}