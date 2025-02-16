import { App, Plugin, Canvas, CanvasNode, Modifier } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { refocusNode } from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";

const MAX_HISTORY = 100;

function selectAndZoom(canvas: Canvas, node: CanvasNode, deselect = true) {
    deselect && canvas.deselectAll();
    canvas.select(node);
    canvas.zoomToSelection();
}

export default class VimCanvas extends Plugin {
    app: App;
    private lastNode: CanvasNode[] = [];
    private moveInterval?: number;
    private currentKey?: string;
    private isAltPressed = false;
    
    private getValidCanvas(): Canvas | null {
        const canvas = getCanvas(this.app);
        if (!canvas || this.lastNode.length === 0) {
            console.debug("No valid canvas or history available");
            return null;
        }
        return canvas;
    }

    private addToHistory(node: CanvasNode) {
        if (this.lastNode.length >= MAX_HISTORY) {
            this.lastNode.shift();
        }
        this.lastNode.push(node);
    }

    private createNavigationCommand(
        key: 'h' | 'j' | 'k' | 'l',
        useDeselect: boolean,
        modifiers: Modifier[] = []
    ) {
        const sortedModifiers = [...modifiers].sort() as Modifier[];
        this.addCommand({
            id: `nav-${sortedModifiers.join('-')}-${key}`,
            name: `Navigate ${key.toUpperCase()}${useDeselect ? '' : ' (multi)'}`,
            callback: () => {
                const canvas = this.getValidCanvas();
                const currentNode = this.lastNode.at(-1);
                if (!canvas || !currentNode) return;

                const newNode = navigateNode(currentNode, canvas, key);
                if (!newNode) {
                    console.debug(`Navigation failed: ${key}`);
                    return;
                }

                this.addToHistory(newNode);
                selectAndZoom(canvas, newNode, useDeselect);
            },
            hotkeys: [{ modifiers: sortedModifiers, key }]
        });
    }

    async onload() {
        this.addCommand({
            id: "refocus-canvas-node",
            name: "Refocus canvas node",
            callback: () => {
                const lastNode = refocusNode(this.app);
                lastNode && this.addToHistory(lastNode);
            },
            hotkeys: [{ modifiers: [], key: "r" }],
        });

        (["h", "j", "k", "l"] as const).forEach((key) => {
            this.createNavigationCommand(key, true, []);
            this.createNavigationCommand(key, false, ["Shift"]);
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && ["h","j","k","l"].includes(e.key.toLowerCase())) {
                e.preventDefault();
                this.isAltPressed = true;
                const currentKey = e.key.toLowerCase();
                this.currentKey = currentKey;
                this.startContinuousMove(currentKey);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.altKey || ["h","j","k","l"].includes(e.key.toLowerCase())) {
                this.stopContinuousMove();
            }
        };

        this.registerDomEvent(document, 'keydown', handleKeyDown);
        this.registerDomEvent(document, 'keyup', handleKeyUp);

        this.app.workspace.onLayoutReady(() => vimCommandPalette(this.app));
    }

    private startContinuousMove(currentKey: string) {
        if (this.moveInterval) return;
        
        const moveStep = 10;
        this.moveInterval = window.setInterval(() => {
            const canvas = this.getValidCanvas();
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

    private stopContinuousMove() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = undefined;
            this.currentKey = undefined;
            this.isAltPressed = false;
        }
    }

    onunload() {
        (vimCommandPalette(this.app) as unknown as { unload?: () => void })?.unload?.();
        this.stopContinuousMove();
    }
}