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
    
    private getValidCanvas(): Canvas | null {
        const canvas = getCanvas(this.app);
        if (!canvas || this.lastNode.length === 0) {
            console.debug("No valid canvas or history available");
            return null;
        }
        return canvas;
    }

    private addToHistory(node: CanvasNode) {
        const startIdx = Math.max(0, this.lastNode.length - MAX_HISTORY + 1);
        this.lastNode = [...this.lastNode.slice(startIdx), node];
    }

    private createNavigationCommand(
        key: 'h' | 'j' | 'k' | 'l',
        useDeselect: boolean,
        modifiers: Modifier[] = []
    ) {
        this.addCommand({
            id: `nav-${modifiers.join('-')}-${key}`,
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
            hotkeys: [{ modifiers, key }]
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
			this.createNavigationCommand(key, true, []); // 单节点选择
			this.createNavigationCommand(key, false, ["Shift"]); // 多节点选择
			this.addCommand({
				id: `move nodes ${key}`,
				name: `Move nodes ${key}`,
				callback: () => {
					const canvas = this.getValidCanvas();
					const currentSelection = canvas?.selection;
					currentSelection?.forEach((node) => {
						const moveStep = 5; // 移动步长可调整
						switch (key) {
							case "h":
								node.moveAndResize(node.x - moveStep, node.y);
								break;
							case "j":
								node.moveAndResize(node.x, node.y + moveStep);
								break;
							case "k":
								node.moveAndResize(node.x, node.y - moveStep);
								break;
							case "l":
								node.moveAndResize(node.x + moveStep, node.y);
								break;
						}
					});
				},
				hotkeys: [{ modifiers: ["Alt"], key }],
			});
		});

        this.app.workspace.onLayoutReady(() => vimCommandPalette(this.app));
    }

    onunload() {}
}
