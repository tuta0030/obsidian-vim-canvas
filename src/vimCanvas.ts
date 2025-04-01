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
	private lastNodeList: CanvasNode[] = [];
	private hjklList = ["h", "j", "k", "l"];
	private refocusKey = ["r"];
	private toggleEdit = " ";
	private createRight = ["enter"];
	private createDown = ["tab"];
	private deleteNode = ["x"];
	private moveInterval?: number;
	private isAltPressed = false;

	private getCurrentInfo() {
		let canvas = getCanvas(this.app);
		let canvasView = this.app.workspace.getActiveViewOfType(ItemView);
		if (!canvas || !canvasView) {console.log("canvas not found");};
		let getANodeInView = canvas?.getViewportNodes().values().next().value;
		let currentNode = canvas?.selection.values().next().value;
		// if (!currentNode) {console.log("current Node not found");}
		const lastNode = this.lastNodeList;
		// if (!lastNode) { console.log("last Node is empty");}
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
		const key = e.key.toLowerCase();
		const canvas = this.getCurrentInfo()?.canvas;
		let currentNode = this.getCurrentInfo()?.currentNode;
		let activeElement = this.getCurrentInfo()?.activeElement;

		// ignore prompt input
		if (activeElement?.hasClass("prompt-input")) return;
		// esc to deselect all
		if (e.key === "Escape") {
			e.preventDefault();
			canvas?.deselectAll();
		}
		// toggle edit
		if (e.key === this.toggleEdit && !this.isEditing()) {
			e.preventDefault();
			currentNode.startEditing();
		}
		// create node
		if (this.createRight.includes(key) && canvas) {
			e.preventDefault();
			createNode(this.app, this.lastNodeList, false);
		}
		if (this.createDown.includes(key) && canvas) {
			e.preventDefault();
			createNode(this.app, this.lastNodeList, true);
		}
		// delete node
		if (this.deleteNode.includes(key) && canvas) {
			e.preventDefault();
			// @ts-ignore
			canvas.deleteSelection();
		}
		// refocus
		if (this.refocusKey.includes(key) && canvas) {
			e.preventDefault();
			refocusNode(canvas, true, this.lastNodeList);
		}
		// hjkl for navigate node
		if (!this.hjklList.includes(key)) return; // return if not hjkl
		// alt + hjkl for continuous move
		if (e.altKey && this.hjklList.includes(key)) {
			e.preventDefault();
			this.isAltPressed = true;
			startContinuousMove(this.app, key as "h"|"j"|"k"|"l");
		}
		// shift hjkl to add selected nodes
		else if (e.shiftKey && this.hjklList.includes(key)) {
			e.preventDefault();
			if (canvas && currentNode) {
				let nextNode = navigateNode(canvas, key as "h"|"j"|"k"|"l", this.lastNodeList);
				if (nextNode) {
					addToHistory(nextNode, this.lastNodeList);
					selectAndZoom(canvas, nextNode, false);
				}
			}
		}
		// hjkl for navigate node
		else if (this.hjklList.includes(key)) {
			e.preventDefault();
			if (canvas && currentNode) {
				let nextNode = navigateNode(canvas, key as "h"|"j"|"k"|"l");
				if (nextNode) {
					addToHistory(nextNode, this.lastNodeList);
					selectAndZoom(canvas, nextNode)
				}
			}
		}
	}

	private handleKeyUp(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		if (!e.altKey || ["h", "j", "k", "l"].includes(key)) {
			stopContinuousMove();
		}
	}


	private handleVimCanvasKeyPress() {
		this.registerDomEvent(document,"keydown",this.handleKeyDown.bind(this));
		this.registerDomEvent(document, "keyup", this.handleKeyUp.bind(this));
	}

	async onload() {
		this.handleVimCanvasKeyPress();
		vimCommandPalette(this.app); // TODO: add outline keys, accept ctrl n/ctrl p
	}

	onunload() {
		(
			vimCommandPalette(this.app) as unknown as { unload?: () => void }
		)?.unload?.();
		stopContinuousMove();
	}
}
