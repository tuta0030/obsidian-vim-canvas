import { App, Plugin, Canvas, CanvasNode, Modifier, ItemView, Scope } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { createNode } from "./vimCanvasCreateNode";
import { refocusNode } from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";
import { startContinuousMove, stopContinuousMove } from "./vimCanvasMoveNodes";
import { selectAndZoom } from "./vimCanvasSelectAndZoom";
import { addToHistory } from "./vimCanvasAddToHistory";

export default class VimCanvas extends Plugin {
	app: App;
	private lastNode: CanvasNode[] = [];
	private hjklList = ["h", "j", "k", "l"];
	private refocusKey = ["r"];
	private moveInterval?: number;
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
		const el = document.activeElement;
		return {
			canvas: canvas,
			canvasView: canvasView,
			currentNode: currentNode, 
			lastNode: lastNode,
			aNode: getANodeInView,
			activeElement: el,
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
		const canvas = this.getCurrentInfo()?.canvas;
		let activeElement = this.getCurrentInfo()?.activeElement;
		if (activeElement?.hasClass("prompt-input")) return;
		// refocus
		if (this.refocusKey.includes(e.key.toLowerCase())) {
			e.preventDefault();
			// console.log(this.getCurrentInfo());
			refocusNode(this.app, true);
		}
		// alt + hjkl for continuous move
		if (e.altKey && this.hjklList.includes(e.key.toLowerCase())) {
			e.preventDefault();
			this.isAltPressed = true;
			startContinuousMove(this.app, e.key.toLowerCase() as "h"|"j"|"k"|"l");
		}
		// hjkl for navigate node
		else if (this.hjklList.includes(e.key.toLocaleLowerCase())) {
			e.preventDefault();
			if (canvas) {
				let nextNode = navigateNode(canvas, e.key.toLowerCase() as "h"|"j"|"k"|"l");
				if (nextNode) {
					selectAndZoom(canvas, nextNode)
				}
			}
		}
	}

	private handleKeyUp(e: KeyboardEvent) {
		if (!e.altKey || ["h", "j", "k", "l"].includes(e.key.toLowerCase())) {
			stopContinuousMove();
		}
	}


	private handleAltMoveNodeKeyPress() {
		this.registerDomEvent(document,"keydown",this.handleKeyDown.bind(this));
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
