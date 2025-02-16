import { App } from "obsidian";
import { getCanvas } from "./vimCanvasGetCanvas";

export function startContinuousMove(app: App, currentKey: string) {
    if (this.moveInterval) return;
    
    const moveStep = 10;
    this.moveInterval = window.setInterval(() => {
        const canvas = getCanvas(app);
        const currentSelection = canvas?.selection;
        if (!currentSelection) return;

        currentSelection.forEach(node => {
            const { x, y } = node;
            const newPos = {
                h: { x: x - moveStep, y },
                j: { x, y: y + moveStep },
                k: { x, y: y - moveStep },
                l: { x: x + moveStep, y }
            }[currentKey];

            if (newPos === undefined) return;
            node.moveTo(newPos);
        });

        canvas?.requestSave();
    }, 50);
}

export function stopContinuousMove() {
    if (this.moveInterval) {
        clearInterval(this.moveInterval);
        this.moveInterval = undefined;
        this.currentKey = undefined;
        this.isAltPressed = false;
    }
}
