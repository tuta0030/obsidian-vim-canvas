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
	private zoomStep = 1;
	private scaleKey = "s";
	private scaleStep = 20;
	private lastZPressTime = 0;
	private keyPressThreshold = 300;
	// private isAltPressed = false;

	private getCurrentInfo() {
		let canvas = getCanvas(this.app);
		let canvasView = this.app.workspace.getActiveViewOfType(ItemView);
		// if (!canvas || !canvasView) {console.log("canvas not found");};
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

		if (!canvas) return;
		// ignore prompt input
		if (activeElement?.hasClass("prompt-input")) return;
		// esc to deselect all
		if (e.key === "Escape" && currentNode) {
			e.preventDefault();
			canvas?.deselectAll();
		}
		// double click z to zoom to selected node
		if (e.key === "z") {
			 const currentTime = Date.now();
				if (currentTime - this.lastZPressTime <= this.keyPressThreshold) {
					// 300ms threshold
					e.preventDefault();
					selectAndZoom(canvas, currentNode, true, true);
					this.lastZPressTime = 0; // Reset after detecting double-tap
				} else {
					this.lastZPressTime = currentTime;
					// Reset timer if no second press within 300ms
					setTimeout(() => {
						if (this.lastZPressTime === currentTime) {
							this.lastZPressTime = 0;
						}
					}, this.keyPressThreshold);
				}
		}
		// increase node height
		if (e.shiftKey && this.scaleKey.includes(key)) {
			currentNode.height += this.scaleStep;	
			currentNode.render();
		}
		if (e.altKey && this.scaleKey.includes(key)) {
			currentNode.height += -this.scaleStep;
			currentNode.render();
		}
		// zoom in and out
		if (e.shiftKey && "z".includes(key)) {
			e.preventDefault();
			// @ts-ignore
			canvas.zoomBy(-this.zoomStep);
		}
		// toggle edit
		if (e.key === this.toggleEdit && !this.isEditing()) {
			e.preventDefault();
			currentNode.startEditing();
		}
		// create node
		if (this.createRight.includes(key)) {
			e.preventDefault();
			createNode(this.app, this.lastNodeList, true);
		}
		if (this.createDown.includes(key)) {
			e.preventDefault();
			createNode(this.app, this.lastNodeList, false);
		}
		// delete node
		if (this.deleteNode.includes(key)) {
			e.preventDefault();
			// @ts-ignore
			canvas.deleteSelection();
		}
		// refocus
		if (this.refocusKey.includes(key)) {
			e.preventDefault();
			refocusNode(canvas, true, this.lastNodeList);
		}
		// hjkl for navigate node
		if (!this.hjklList.includes(key)) return; // return if not hjkl
		// alt + hjkl for continuous move
		if (e.altKey && this.hjklList.includes(key)) {
			e.preventDefault();
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
					selectAndZoom(canvas, nextNode, true, false)
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
