import { App, Plugin, Canvas, CanvasNode, Modifier } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { createNode } from "./vimCanvasCreateNode";
import { refocusNode } from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";
import { startContinuousMove, stopContinuousMove } from "./vimCanvasMoveNodes";

const MAX_HISTORY = 100;

async function selectAndZoom(canvas: Canvas, node: CanvasNode, deselect = true) {
	deselect && canvas.deselectAll();

	// 等待节点完成初始化
	await new Promise((resolve) => {
		const checkNode = () => {
			if (node.width > 0 && node.height > 0) {
				resolve(true);
			} else {
				requestAnimationFrame(checkNode);
			}
		};
		checkNode();
	});

	canvas.select(node);

	// 安全缩放
	try {
		canvas.zoomToSelection();
	} catch (e) {
		console.warn("Zoom failed, fallback to frame", e);
		canvas.requestFrame();
	}
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
		key: "h" | "j" | "k" | "l",
		useDeselect: boolean,
		modifiers: Modifier[] = []
	) {
		const sortedModifiers = [...modifiers].sort() as Modifier[];
		this.addCommand({
			id: `nav-${sortedModifiers.join("-")}-${key}`,
			name: `Navigate ${key.toUpperCase()}${
				useDeselect ? "" : " (multi)"
			}`,
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
			hotkeys: [{ modifiers: sortedModifiers, key }],
		});
	}

	private createCreateNodeCommand(
		key: "tab" | "enter",
		useDeselect: boolean,
		modifiers: Modifier[] = []
	) {
		const sortedModifiers = [...modifiers].sort() as Modifier[];
		const keyCombo = modifiers.toString().toLowerCase() + key.toLowerCase();
		this.addCommand({
			id: `create-node-${sortedModifiers.join("-")}-${key}`,
			name: `Create Node ${key.toUpperCase()}${
				useDeselect ? "" : " (multi)"
			}`,
			callback: async () => {
				console.log(`current key is ${keyCombo}`);
				const canvas = getCanvas(this.app);
				if (!canvas) return;
				const currentNode = this.lastNode.at(-1);
				if (!canvas || !currentNode) return;

				switch (keyCombo) {
					case "enter":
						const newNodeBelow = await createNode(this.app);
                        if (!newNodeBelow) return;
                        canvas.deselectAll();
                        await selectAndZoom(canvas, newNodeBelow, true);
                        this.addToHistory(newNodeBelow);
						break;

					case "tab":
						const newNodeSide = await createNode(this.app, false);
                        if (!newNodeSide) return;
                        canvas.deselectAll();
                        await selectAndZoom(canvas, newNodeSide, true);
                        this.addToHistory(newNodeSide);
						break;

					case "shiftenter":
						const newNodeAbove = await createNode(this.app, false, true);
                        if (!newNodeAbove) return;
                        canvas.deselectAll();
                        await selectAndZoom(canvas, newNodeAbove, true);
                        this.addToHistory(newNodeAbove);
						break;

					default:
						break;
				}
			},
			hotkeys: [{ modifiers: sortedModifiers, key }],
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
				const currentNode = currentSelection.values().next().value;
				if (currentNode.isEditing) return;
				// @ts-ignore
				canvas.deleteSelection(currentNode);
			},
			hotkeys: [{ modifiers: [], key: "x" }],
		});

		// Create node
		this.createCreateNodeCommand("tab", true, []);
		this.createCreateNodeCommand("enter", true, []);
		this.createCreateNodeCommand("enter", true, ["Shift"]);

		(["h", "j", "k", "l"] as const).forEach((key) => {
			// select one node
			this.createNavigationCommand(key, true, []);
			// select multiple nodes
			this.createNavigationCommand(key, false, ["Shift"]);
		});

		// move selected nodes
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.altKey &&
				["h", "j", "k", "l"].includes(e.key.toLowerCase())
			) {
				e.preventDefault();
				this.isAltPressed = true;
				const currentKey = e.key.toLowerCase();
				this.currentKey = currentKey;
				startContinuousMove(this.app, currentKey);
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (
				!e.altKey ||
				["h", "j", "k", "l"].includes(e.key.toLowerCase())
			) {
				stopContinuousMove();
			}
		};

		this.registerDomEvent(document, "keydown", handleKeyDown);
		this.registerDomEvent(document, "keyup", handleKeyUp);

		this.app.workspace.onLayoutReady(() => vimCommandPalette(this.app));
	}

	onunload() {
		(
			vimCommandPalette(this.app) as unknown as { unload?: () => void }
		)?.unload?.();
		stopContinuousMove();
	}
}
