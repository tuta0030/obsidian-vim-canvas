import { App, Plugin, CanvasNode, ItemView, PluginSettingTab, Setting } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { createNode } from "./vimCanvasCreateNode";
import { refocusNode } from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";
import { startContinuousMove, stopContinuousMove } from "./vimCanvasMoveNodes";
import { selectAndZoom } from "./vimCanvasSelectAndZoom";
import { addToHistory } from "./vimCanvasAddToHistory";
import {VimCanvasSettingTab} from "./vimCanvasSettingTab"



interface PluginSettings {
    hjklList: string[];
    refocusKey: string;
    toggleEditKey: string;
	createRight: string;
    createDown: string;
    deleteNode: string;
    zoomStep: number;
    scaleStep: number;
    keyPressThreshold: number;
    isNavZoom: boolean;
	lastZPressTime: number;
	scaleKey: string;
	toggleEdit: string;
}


export default class VimCanvas extends Plugin {
	app: App;
	private lastNodeList: CanvasNode[] = [];
	public settings: PluginSettings = {
		createRight: "enter",
		hjklList: ["h", "j", "k", "l"],
		toggleEdit: " ",
		lastZPressTime: 0,
		refocusKey: "r",
		toggleEditKey: " ",
		createDown: "tab",
		deleteNode: "x",
		scaleKey: "s",
		zoomStep: 1,
		scaleStep: 20,
		keyPressThreshold: 300,
		isNavZoom: true,
	};
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
		const { canvas, currentNode } = this.getCurrentInfo() || {};
		if (!canvas || !currentNode) return false;
		// @ts-ignore
		if (currentNode.isEditing)
			console.log(`current Node ${currentNode} is Editing`);
		return currentNode.isEditing;
	}

	private async handleKeyDown(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		const canvas = this.getCurrentInfo()?.canvas;
		let currentNode = this.getCurrentInfo()?.currentNode;
		let activeElement = this.getCurrentInfo()?.activeElement;

		if (!canvas) return;
		// if command palette is opened, ignore the key press 
		if (activeElement?.hasClass("prompt-input")) return;
		// @ts-ignore if settings tab is opened, ignore the key press
		if (this.app.setting.activeTab) return;
		// esc to deselect all
		if (e.key === "Escape" && currentNode) {
			e.preventDefault();
			canvas?.deselectAll();
		}
		// double click z to zoom to selected node
		if (e.key === "z") {
			// if no node selected, return
			if (canvas.selection.size == 0) return;
			const currentTime = Date.now();
			if (
				currentTime - this.settings.lastZPressTime <=
				this.settings.keyPressThreshold
			) {
				// 300ms threshold
				e.preventDefault();
				selectAndZoom(canvas, currentNode, true, true);
				this.settings.lastZPressTime = 0; // Reset after detecting double-tap
			} else {
				this.settings.lastZPressTime = currentTime;
				// Reset timer if no second press within 300ms
				setTimeout(() => {
					if (this.settings.lastZPressTime === currentTime) {
						this.settings.lastZPressTime = 0;
					}
				}, this.settings.keyPressThreshold);
			}
		}
		// increase node height
		if (e.shiftKey && this.settings.scaleKey.includes(key)) {
			currentNode.height += this.settings.scaleStep;
			currentNode.render();
		}
		if (e.altKey && this.settings.scaleKey.includes(key)) {
			currentNode.height += -this.settings.scaleStep;
			currentNode.render();
		}
		// zoom in and out
		if (e.shiftKey && "z".includes(key)) {
			e.preventDefault();
			// @ts-ignore
			canvas.zoomBy(-this.settings.zoomStep);
		}
		// toggle edit
		if (e.key === this.settings.toggleEdit && !this.isEditing()) {
			e.preventDefault();
			currentNode.startEditing();
		}
		// create node
		if (this.settings.createRight.includes(key)) {
			e.preventDefault();
			const _createdNode = createNode(this.app, this.lastNodeList, true);
			if (_createdNode) {
				addToHistory(await _createdNode, this.lastNodeList);
				selectAndZoom(canvas, await _createdNode, true, this.settings.isNavZoom);
			}
		}
		if (this.settings.createDown.includes(key)) {
			e.preventDefault();
			const _createdNode = createNode(this.app, this.lastNodeList, false);
			if (_createdNode) {
				addToHistory(await _createdNode, this.lastNodeList);
				selectAndZoom(canvas, await _createdNode, true, this.settings.isNavZoom);
			}
		}
		// delete node
		if (this.settings.deleteNode.includes(key)) {
			e.preventDefault();
			// @ts-ignore
			canvas.deleteSelection();
			canvas.selection.forEach((node) => {
				this.lastNodeList.remove(node);
			});
			selectAndZoom(canvas, this.lastNodeList[this.lastNodeList.length - 1], true, true);
		}
		// refocus
		if (this.settings.refocusKey.includes(key)) {
			e.preventDefault();
			refocusNode(canvas, true, this.lastNodeList);
		}
		// hjkl for navigate node
		if (!this.settings.hjklList.includes(key)) return; // return if not hjkl
		// alt + hjkl for continuous move
		if (e.altKey && this.settings.hjklList.includes(key)) {
			e.preventDefault();
			startContinuousMove(this.app, key as "h" | "j" | "k" | "l");
		}
		// shift hjkl to add selected nodes
		else if (e.shiftKey && this.settings.hjklList.includes(key)) {
			e.preventDefault();
			if (canvas && currentNode) {
				let nextNode = navigateNode(
					canvas,
					key as "h" | "j" | "k" | "l",
					this.lastNodeList
				);
				if (nextNode) {
					addToHistory(nextNode, this.lastNodeList);
					selectAndZoom(canvas, nextNode, false);
				}
			}
		}
		// hjkl for navigate node
		else if (this.settings.hjklList.includes(key)) {
			e.preventDefault();
			if (canvas && currentNode) {
				let nextNode = navigateNode(
					canvas,
					key as "h" | "j" | "k" | "l"
				);
				if (nextNode) {
					addToHistory(nextNode, this.lastNodeList);
					selectAndZoom(canvas, nextNode, true, this.settings.isNavZoom);
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
		this.registerDomEvent(
			document,
			"keydown",
			this.handleKeyDown.bind(this)
		);
		this.registerDomEvent(document, "keyup", this.handleKeyUp.bind(this));
	}

	async onload() {
		await this.loadSettings();
		this.handleVimCanvasKeyPress();
		vimCommandPalette(this.app);

		this.addSettingTab(new VimCanvasSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.settings, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		(
			vimCommandPalette(this.app) as unknown as { unload?: () => void }
		)?.unload?.();
		stopContinuousMove();
	}
}
