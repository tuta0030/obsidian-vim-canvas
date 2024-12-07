import { App, CanvasNode, Plugin, TFile, ItemView } from "obsidian";
import { around } from "monkey-around";
import { createChildFileNode } from "./utils";
import {
	DEFAULT_SETTINGS,
	vimCanvasSettings,
	vimCanvasSettingTab,
} from "./vimCanvasSettings";
import {
	createEdge,
	createSiblingNode,
	createChildNode,
	createFloatingNode,
	siblingNode,
	childNode,
} from "./createEdgeAndNodes";
import { navigateNode } from "./navigateNode";
import { selectNextNode, selectNextNodeAndCurrent } from "./selectNodes";
import { vimCommandPalette } from "./vimCommandPalette";
import { shortCutFunctions } from "./shortCuts";
import {
	uninstaller as vimUninstaller,
	canvasViewunistaller as vimCanvasViewUninstaller,
} from "./vimCanvasUninstaller";

// Global Variable for multiple selection with navigation
let lastNode: CanvasNode;

export default class VimCanvas extends Plugin {
	settings: vimCanvasSettings;
	settingTab: vimCanvasSettingTab;
	app: App;

	async onload() {
		await this.registerSettings();
		this.registerCommands();
		this.patchCanvas();
		this.patchMarkdownFileInfo();
		this.patchCanvasNode();
		this.vimCommandPalette();
	}

	onunload() {}

	vimCommandPalette() {
		vimCommandPalette(this.app);
	}

	async registerSettings() {
		this.settingTab = new vimCanvasSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
		await this.loadSettings();
	}

	registerCommands() {
		this.addCommand({
			id: "split-heading-into-mindmap",
			name: "Split Heading into mindmap based on H1",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const canvasView =
					this.app.workspace.getActiveViewOfType(ItemView);
				if (canvasView?.getViewType() === "canvas") {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.

					if (!checking) {
						// @ts-ignore
						const canvas = canvasView?.canvas;
						const currentSelection = canvas?.selection;
						if (currentSelection.size > 1) {
							return;
						}

						const currentSelectionItem = currentSelection
							.values()
							.next().value;
						if (!currentSelectionItem.filePath) return;

						const currentSelectionItemFile =
							currentSelectionItem.file as TFile;
						if (!(currentSelectionItemFile.extension === "md"))
							return;

						const currentFileHeadings =
							this.app.metadataCache.getFileCache(
								currentSelectionItemFile
							)?.headings;
						if (!currentFileHeadings) return;

						const currentFileHeadingH1 = currentFileHeadings.filter(
							(heading) => heading.level === 1
						);
						if (currentFileHeadingH1.length === 0) return;

						const nodeGroupHeight =
							(currentSelectionItem.height * 0.6 + 20) *
							currentFileHeadingH1.length;
						let direction = -1;
						const nodeGroupY =
							currentSelectionItem.y +
							currentSelectionItem.height / 2 +
							(nodeGroupHeight / 2) * direction;

						currentFileHeadingH1.forEach((item, index) => {
							createChildFileNode(
								canvas,
								currentSelectionItem,
								currentSelectionItemFile,
								"#" + item.heading,
								nodeGroupY -
									direction *
										(currentSelectionItem.height * 0.6 +
											20) *
										index
							);
						});
					}
					return true;
				}
			},
		});

		this.addCommand({
			id: "create-floating-node",
			name: "Create floating node",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const canvasView =
					this.app.workspace.getActiveViewOfType(ItemView);
				if (canvasView?.getViewType() === "canvas") {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						// @ts-ignore
						const canvas = canvasView?.canvas;

						const node = canvas.createTextNode({
							pos: {
								x: 0,
								y: 0,
								height: 500,
								width: 400,
							},
							size: {
								x: 0,
								y: 0,
								height: 500,
								width: 400,
							},
							text: "",
							focus: true,
							save: true,
						});

						canvas.addNode(node);
						canvas.requestSave();
						if (!node) return;

						setTimeout(() => {
							node.startEditing();
							canvas.zoomToSelection();
						}, 0);
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		this.addCommand({
			id: "create-child-node",
			name: "Create child node",
			checkCallback: (checking: boolean) => {
				const view = this.app.workspace.getActiveViewOfType(ItemView);
				const canvasView =
					this.app.workspace.getActiveViewOfType(ItemView);
				if (canvasView?.getViewType() === "canvas") {
					if (!checking) {
						// @ts-ignore
						const canvas = canvasView?.canvas;

						createChildNode(canvas, true).then((node) => {
							if (!node) return;

							setTimeout(() => {
								const realNode = canvas.nodes?.get(node.id);
								canvas.zoomToSelection();

								realNode?.startEditing();
							}, 0);
						});
					}

					return true;
				}
			},
		});

		this.addCommand({
			id: "create-sibling-node",
			name: "Create sibling node",
			checkCallback: (checking: boolean) => {
				const view = this.app.workspace.getActiveViewOfType(ItemView);
				const canvasView =
					this.app.workspace.getActiveViewOfType(ItemView);
				if (canvasView?.getViewType() === "canvas") {
					if (!checking) {
						// @ts-ignore
						const canvas = canvasView?.canvas;

						createSiblingNode(canvas, true).then((node) => {
							if (!node) return;

							setTimeout(() => {
								// @ts-ignore
								const realNode = canvas.nodes?.get(node.id);
								canvas.zoomToSelection();

								realNode?.startEditing();
							}, 0);
						});
					}

					return true;
				}
			},
		});
	}

	patchCanvas() {
		const patchCanvas = () => {
			const self = this;
			const canvasView = this.app.workspace
				.getLeavesOfType("canvas")
				.first()?.view;
			if (!canvasView) {
				return;
			} else {
				const canvas = canvasView?.canvas;
				const patchCanvasView = canvas.constructor;
				const vU = vimUninstaller(patchCanvasView);
				const vCVU = vimCanvasViewUninstaller(
					canvasView,
					shortCutFunctions,
					createFloatingNode,
					selectNextNode,
					navigateNode,
					selectNextNodeAndCurrent
				);

				this.register(vU);
				this.register(vCVU);
				canvas?.view.leaf.rebuildView();
				// console.log("Obsidian-Canvas-MindMap: canvas view patched");
				return true;
			}
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchCanvas()) {
				const evt = this.app.workspace.on("layout-change", () => {
					patchCanvas() && this.app.workspace.offref(evt);
				});
				this.registerEvent(evt);
			}
		});
	}

	patchCanvasNode() {
		const patchNode = () => {
			const canvasView = this.app.workspace
				.getLeavesOfType("canvas")
				.first()?.view;
			// @ts-ignore
			const canvas = canvasView?.canvas;
			if (!canvas) return false;

			const node = Array.from(canvas.nodes).first();
			if (!node) return false;

			// @ts-ignore
			const nodeInstance = node[1];

			const uninstaller = around(nodeInstance.constructor.prototype, {
				setColor: (next: any) =>
					function (e: any, t: any) {
						next.call(this, e, t);
						this.canvas
							.getEdgesForNode(this)
							.forEach((edge: any) => {
								if (edge.from.node === this) {
									edge.setColor(e, true);
									edge.render();
									// edge.to.node.setColor(e, true);
								}
							});
						canvas.requestSave();
					},
			});
			this.register(uninstaller);

			// console.log("Obsidian-Canvas-MindMap: canvas node patched");
			return true;
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchNode()) {
				const evt = this.app.workspace.on("layout-change", () => {
					patchNode() && this.app.workspace.offref(evt);
				});
				this.registerEvent(evt);
			}
		});
	}

	patchMarkdownFileInfo() {
		const patchEditor = () => {
			const editorInfo = this.app.workspace.activeEditor;

			// console.log(editorInfo);
			if (!editorInfo) return false;
			if (
				!editorInfo ||
				!editorInfo.containerEl ||
				editorInfo.containerEl.closest(".common-editor-inputer")
			)
				return false;

			const patchEditorInfo = editorInfo.constructor;

			const uninstaller = around(patchEditorInfo.prototype, {
				showPreview: (next) =>
					function (e: any) {
						next.call(this, e);
						if (e) {
							this.node?.canvas.wrapperEl.focus();
							this.node?.setIsEditing(false);
						}
					},
			});
			this.register(uninstaller);

			// console.log("Obsidian-Canvas-MindMap: markdown file info patched");
			return true;
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchEditor()) {
				const evt = this.app.workspace.on("file-open", () => {
					setTimeout(() => {
						patchEditor() && this.app.workspace.offref(evt);
					}, 100);
				});
				this.registerEvent(evt);
			}
		});
	}

	public async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
