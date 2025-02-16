import { App, Plugin, Canvas, CanvasNode, Modifier } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { createNode } from "./vimCanvasCreateNode"
import { refocusNode } from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";
import {startContinuousMove, stopContinuousMove} from "./vimCanvasMoveNodes"
import { log } from "console";

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
        // Refocus canvas node
        this.addCommand({
            id: "refocus-canvas-node",
            name: "Refocus canvas node",
            callback: () => {
                const lastNode = refocusNode(this.app);
                lastNode && this.addToHistory(lastNode);
            },
            hotkeys: [{ modifiers: [], key: "r" }],
        });
        // Delete node
        this.addCommand({
			id: "delete-canvas-node",
			name: "Delete canvas node",
			callback: () => {
				const canvas = this.getValidCanvas();
				if (!canvas) return;
				const currentSelection = canvas.selection;
				if (currentSelection.values().next().value.isEditing) return;
				// @ts-ignore
				canvas.deleteSelection();
			},
			hotkeys: [{ modifiers: [], key: "x" }],
		});

		// Create node
		// TODO: new node not connected to the last node
		(["enter", "tab"] as const).forEach((key) => {
			this.addCommand({
				id: `create-node-${key}`,
				name: `Create node (${key.toUpperCase()})`,
				callback: () => {
					const canvas = getCanvas(this.app);
					if (!canvas) return;

					if (key === "enter") {
						createNode(this.app);
					} else if (key === "tab") {
						createNode(this.app, false);
					}
				},
				hotkeys: [{ modifiers: [], key }],
			});
		});

        (["h", "j", "k", "l"] as const).forEach((key) => {
            // select one node
            this.createNavigationCommand(key, true, []);
            // select multiple nodes
            this.createNavigationCommand(key, false, ["Shift"]);
        });

        // move selected nodes
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && ["h","j","k","l"].includes(e.key.toLowerCase())) {
                e.preventDefault();
                this.isAltPressed = true;
                const currentKey = e.key.toLowerCase();
                this.currentKey = currentKey;
                startContinuousMove(this.app, currentKey);
            }
        };
        
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.altKey || ["h","j","k","l"].includes(e.key.toLowerCase())) {
                stopContinuousMove();
            }
        };

        this.registerDomEvent(document, 'keydown', handleKeyDown);
        this.registerDomEvent(document, 'keyup', handleKeyUp);

        this.app.workspace.onLayoutReady(() => vimCommandPalette(this.app));
    }

    onunload() {
        (vimCommandPalette(this.app) as unknown as { unload?: () => void })?.unload?.();
        stopContinuousMove();
    }
}