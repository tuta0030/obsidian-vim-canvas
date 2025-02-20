import { App, Plugin, Canvas, CanvasNode, Modifier, ItemView, Scope } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { createNode } from "./vimCanvasCreateNode";
import { refocusNode } from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";
import { startContinuousMove, stopContinuousMove } from "./vimCanvasMoveNodes";
import { selectAndZoom } from "./vimCanvasSelectAndZoom";
import { addToHistory } from "./vimCanvasAddToHistory";
import { get } from "http";

export default class VimCanvas extends Plugin {
	app: App;
	private lastNode: CanvasNode[] = [];
	private moveInterval?: number;
	private currentNavKey?: "h"|"j"|"k"|"l";
	private currentKey?: String;
	private isAltPressed = false;

	private getCurrentInfo() {
		let canvas = getCanvas(this.app);
		let canvasView = this.app.workspace.getActiveViewOfType(ItemView);
		if (!canvas || !canvasView) {console.log("canvas not found");};
		let getANodeInView = canvas?.getViewportNodes().values().next().value;
		let currentNode = canvas?.selection.values().next().value;
		if (!currentNode) {console.log("current Node not found");}
		const lastNode = this.lastNode;
		if (!lastNode) { console.log("last Node is empty");}
		return {
			canvas: canvas,
			canvasView: canvasView,
			currentNode: currentNode, 
			lastNode: lastNode,
			aNode: getANodeInView,
		};
	}

	private isEditing(): boolean {
		const {canvas, currentNode} = this.getCurrentInfo() || {};
		if (!canvas || !currentNode) return false;
		// @ts-ignore
		if (currentNode.isEditing) console.log(
			`current Node ${currentNode} is Editing`
		);
		return currentNode.isEditing;
	}

	private handleKeyDown(e: KeyboardEvent) {
		// alt + hjkl for continuous move
		if (e.altKey && ["h", "j", "k", "l"].includes(e.key.toLowerCase())) {
			e.preventDefault();
			this.isAltPressed = true;
			this.currentNavKey = e.key.toLowerCase() as "h"|"j"|"k"|"l";
			startContinuousMove(this.app, this.currentNavKey!);
		}
	}

	private handleKeyUp(e: KeyboardEvent) {
		if (!e.altKey || ["h", "j", "k", "l"].includes(e.key.toLowerCase())) {
			stopContinuousMove();
		}
	}


	private handleAltMoveNodeKeyPress() {
		this.registerDomEvent(
			document,
			"keydown",
			this.handleKeyDown.bind(this)
		);
		this.registerDomEvent(document, "keyup", this.handleKeyUp.bind(this));
	}

	async onload() {

		this.handleAltMoveNodeKeyPress();
		vimCommandPalette(this.app);
	}

	onunload() {
		(
			vimCommandPalette(this.app) as unknown as { unload?: () => void }
		)?.unload?.();
		stopContinuousMove();
	}
}
