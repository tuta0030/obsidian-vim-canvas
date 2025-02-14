import { App, Plugin, Canvas, CanvasNode } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { refocusNode } from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";

const MAX_HISTORY = 100;

function selectAndZoom(canvas: Canvas, node: CanvasNode, deselect = true) {
	if (deselect) {
		canvas.deselectAll();
		canvas.select(node);
		canvas.zoomToSelection();
	} else {
		canvas.select(node);
		canvas.zoomToSelection();
	}
}

export default class VimCanvas extends Plugin {
    app: App;
    private lastNode: CanvasNode[] = [];
    
    private getValidCanvas(): Canvas | null {
        const canvas = getCanvas(this.app);
        if (!canvas || this.lastNode.length === 0) {
            console.debug("No valid canvas or history available");
            return null;
        }
        return canvas;
    }

    async onload() {
        // 重构后的重聚焦命令
        this.addCommand({
            id: 'refocus-canvas-node',
            name: 'Refocus canvas node',
            callback: () => {
                const lastNode = refocusNode(this.app);
                if (lastNode) {
                    this.lastNode = [
                        ...this.lastNode.slice(-MAX_HISTORY + 1), 
                        lastNode
                    ];
                }
            },
            hotkeys: [{ modifiers: [], key: "r" }]
        });

        // 优化后的导航命令
        (['h', 'j', 'k', 'l'] as const).forEach((key) => {
            this.addCommand({
                id: `navigate-${key}`,
                name: `Navigate ${key.toUpperCase()}`,
                callback: () => {
                    const canvas = this.getValidCanvas();
                    const currentNode = this.lastNode.at(-1);
                    
                    if (!canvas || !currentNode) return;

                    const newNode = navigateNode(currentNode, canvas, key);
                    if (!newNode) {
                        console.debug(`Navigation failed for key: ${key}`);
                        return;
                    }

                    this.lastNode = [
                        ...this.lastNode.slice(-MAX_HISTORY + 1), 
                        newNode
                    ];
                    selectAndZoom(canvas, newNode, false);
                },
                hotkeys: [{ modifiers: ["Shift"], key }],
            });
        });


        // select multiple nodes command
        (['h', 'j', 'k', 'l'] as const).forEach((key) => {
            this.addCommand({
                id: `add-selection-${key}`,
                name: `Add Selection ${key.toUpperCase()}`,
                callback: () => {
                    const canvas = this.getValidCanvas();
                    const currentNode = this.lastNode.at(-1);
                    
                    if (!canvas || !currentNode) return;

                    const newNode = navigateNode(currentNode, canvas, key);
                    if (!newNode) {
                        console.debug(`Navigation failed for key: ${key}`);
                        return;
                    }

                    this.lastNode = [
                        ...this.lastNode.slice(-MAX_HISTORY + 1), 
                        newNode
                    ];
                    selectAndZoom(canvas, newNode);
                },
                hotkeys: [{ modifiers: [], key }],
            });
        });

        this.app.workspace.onLayoutReady(() => {
            vimCommandPalette(this.app);
        });
    }

    onunload() {}
}
