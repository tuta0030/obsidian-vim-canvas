import {
	App,
	Canvas,
	CanvasEdge,
	CanvasNode,
	Plugin,
	TFile,
	ItemView,
} from "obsidian";
import { around } from "monkey-around";
import { addEdge, addNode, createChildFileNode, random } from "./utils";
import {
	DEFAULT_SETTINGS,
	vimCanvasSettings,
	vimCanvasSettingTab,
} from "./vimCanvasSettings";
import { CanvasEdgeData } from "obsidian/canvas";

function isKeyRelevant(
	// document: HTMLDocument,
	event: KeyboardEvent,
	isSuggesting: boolean
) {
	if (!document.activeElement || !event.ctrlKey) {
		return false;
	}

	const el = document.activeElement;
	const isInOmniSearch = el.closest(".omnisearch-modal");
	const isInAutoCompleteFile = el.closest(".cm-content");
	// The OmniSearch plugin already maps Ctrl-J and Ctrl-K
	return (
		(!isInOmniSearch && el.hasClass("prompt-input")) ||
			isInAutoCompleteFile ||
			isSuggesting,
		event
	);
}

const createEdge = async (
	node1: CanvasNode,
	node2: CanvasNode,
	canvas: Canvas
) => {
	addEdge(
		canvas,
		random(16),
		{
			fromOrTo: "from",
			side: "right",
			node: node1,
		},
		{
			fromOrTo: "to",
			side: "left",
			node: node2,
		}
	);
};

// Global Variable for multiple selection with navigation
let lastNode: CanvasNode;
const navigateNode = (canvas: Canvas, direction: "h" | "j" | "k" | "l") => {
	let lastNodeSet: Set<CanvasNode> = new Set();
	if (lastNode) {
		lastNodeSet.add(lastNode);
	}
	let currentSelection = lastNode ? lastNodeSet : canvas.selection;

	// Check if the selected node is editing
	if (currentSelection.values().next().value.isEditing) return;

	const selectedItem =
		currentSelection instanceof Set
			? (currentSelection.values().next().value as CanvasNode)
			: currentSelection;
	const allTheNodes = canvas.nodes;
	const viewportNodes = canvas.getViewportNodes();

	const { x, y } = selectedItem;

	// Define direction vectors
	const directionVectors = {
		h: { dx: -1, dy: 0 }, // left
		j: { dx: 0, dy: 1 }, // down
		k: { dx: 0, dy: -1 }, // up
		l: { dx: 1, dy: 0 }, // right
	};

	const targetVector = directionVectors[direction];
	if (!targetVector) return;

	// Calculate the target angle in degrees
	const targetAngle =
		Math.atan2(targetVector.dy, targetVector.dx) * (180 / Math.PI);

	// Helper function to calculate angle difference considering 360 degree wrap-around
	const calculateAngleDifference = (angle1: number, angle2: number) => {
		let diff = Math.abs(angle1 - angle2);
		if (diff > 180) {
			diff = 360 - diff;
		}
		return diff;
	};

	// Calculate distances and angles for all nodes
	const nodesWithDistances = Array.from(allTheNodes.values())
		.map((node) => {
			const nx = node.x;
			const ny = node.y;
			const dx = nx - x;
			const dy = ny - y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Determine if the node is in the desired direction
			let isInDirection = false;
			switch (direction) {
				case "h": // left
					isInDirection = dx < 0;
					break;
				case "j": // down
					isInDirection = dy > 0;
					break;
				case "k": // up
					isInDirection = dy < 0;
					break;
				case "l": // right
					isInDirection = dx > 0;
					break;
			}

			const angle = Math.atan2(dy, dx) * (180 / Math.PI);
			const angleDifference = calculateAngleDifference(
				angle,
				targetAngle
			);

			return { node, distance, isInDirection, angleDifference };
		})
		.filter(
			(item) => item.node.id !== selectedItem.id && item.isInDirection
		);

	// First, filter nodes within 6 degrees and in viewportNodes
	const nodesWithin6Degrees = nodesWithDistances.filter(
		(item) =>
			item.angleDifference <= 3 &&
			viewportNodes.includes(item.node) &&
			(direction === "h" || direction === "l")
	);

	// If there are nodes within 6 degrees, and nodes in viewportNodes, sort them by distance and select the closest one
	if (nodesWithin6Degrees.length > 0) {
		nodesWithin6Degrees.sort((a, b) => a.distance - b.distance);
		const nextNode = nodesWithin6Degrees[0].node;
		lastNode = nextNode;
		return nextNode;
	}

	// If no nodes within 6 degrees, filter nodes within 60 degrees and select the closest one
	const nodesWithin60Degrees = nodesWithDistances.filter(
		(item) => item.angleDifference <= 60
	);
	if (nodesWithin60Degrees.length > 0) {
		nodesWithin60Degrees.sort((a, b) => a.distance - b.distance);
		const nextNode = nodesWithin60Degrees[0].node;
		lastNode = nextNode;
		return nextNode;
	}
};

// const lastSelectionNode = () => {
// 	const canvas = app.workspace.activeLeaf.view.canvas;
// 	const lastSelectionNode = canvas.selection.values().toArray();
// 	return lastSelectionNode[canvas.selection.size-1];
// }

// Select next node
const selectNextNode = (nextNode: CanvasNode | undefined, app: App) => {
	const canvas = app.workspace.activeLeaf.view.canvas;
	if (!nextNode) return;
	if (nextNode) {
		canvas.selectOnly(nextNode);
		canvas.zoomToSelection();
	}
};

const selectNextNodeAndCurrent = (
	nextNode: CanvasNode | undefined,
	app: App
) => {
	// TODO find a alternative to get canvas object
	const canvas = app.workspace.activeLeaf.view.canvas;
	if (!nextNode) {
		return;
	}
	if (nextNode) {
		canvas.select(nextNode);
		canvas.zoomToSelection();
		return nextNode;
	}
};

const createFloatingNode = (canvas: any, direction: string) => {
	let selection = canvas.selection;

	if (selection.size !== 1) return;
	// Check if the selected node is editing
	if (selection.values().next().value.isEditing) return;

	let node = selection.values().next().value;
	let x =
		direction === "left"
			? node.x - node.width - 50
			: direction === "right"
			? node.x + node.width + 50
			: node.x;
	let y =
		direction === "top"
			? node.y - node.height - 100
			: direction === "bottom"
			? node.y + node.height + 100
			: node.y;

	const tempChildNode = addNode(canvas, random(16), {
		x: x,
		y: y,
		width: node.width,
		height: node.height,
		type: "text",
		content: "",
	});

	canvas?.requestSave();

	const currentNode = canvas.nodes?.get(tempChildNode?.id!);
	if (!currentNode) return;

	canvas.selectOnly(currentNode);
	canvas.zoomToSelection();

	setTimeout(() => {
		currentNode.startEditing();
	}, 100);

	return tempChildNode;
};

const childNode = async (canvas: Canvas, parentNode: CanvasNode, y: number) => {
	let tempChildNode = addNode(canvas, random(16), {
		x: parentNode.x + parentNode.width + 200,
		y: y,
		width: parentNode.width,
		height: parentNode.height,
		type: "text",
		content: "",
	});
	await createEdge(parentNode, tempChildNode, canvas);

	canvas.deselectAll();
	const node = canvas.nodes?.get(tempChildNode?.id!);
	if (!node) return;
	canvas.selectOnly(node);

	canvas.requestSave();

	return tempChildNode;
};

const createChildNode = async (canvas: Canvas, ignored: boolean) => {
	if (canvas.selection.size !== 1) return;
	const parentNode = canvas.selection.entries().next().value[1];

	if (parentNode.isEditing && !ignored) return;

	// Calculate the height of all the children nodes
	let wholeHeight = 0;
	let tempChildNode;
	const canvasData = canvas.getData();

	const prevParentEdges = canvasData.edges.filter((item: CanvasEdgeData) => {
		return item.fromNode === parentNode.id && item.toSide === "left";
	});

	if (prevParentEdges.length === 0) {
		tempChildNode = await childNode(canvas, parentNode, parentNode.y);
	} else {
		tempChildNode = await siblingNode(canvas, parentNode, prevParentEdges);
	}

	return tempChildNode;
};

const siblingNode = async (
	canvas: Canvas,
	parentNode: CanvasNode,
	prevParentEdges: CanvasEdgeData[]
) => {
	const allEdges = canvas
		.getEdgesForNode(parentNode)
		.filter((item: CanvasEdge) => {
			return prevParentEdges.some((edge: CanvasEdgeData) => {
				return item.to.node.id === edge.toNode;
			});
		});

	const allNodes = allEdges.map((edge: CanvasEdge) => edge.to.node);
	allNodes.sort((a, b) => a.y - b.y);
	const lastNode = allNodes[allNodes.length - 1];
	canvas.selectOnly(lastNode);
	return await createSiblingNode(canvas, false);
};

const createSiblingNode = async (canvas: Canvas, ignored: boolean) => {
	if (canvas.selection.size !== 1) return;
	const selectedNode = canvas.selection.entries().next().value[1];

	if (selectedNode.isEditing && !ignored) return;

	const incomingEdges = canvas
		.getEdgesForNode(selectedNode)
		.filter((edge: CanvasEdge) => edge.to.node.id === selectedNode.id);
	if (incomingEdges.length === 0) return;
	const parentNode = incomingEdges[0].from.node;

	const newYPosition = selectedNode.y + selectedNode.height / 2 + 110;
	const newChildNode = await childNode(canvas, parentNode, newYPosition);

	const leftSideEdges = canvas
		.getEdgesForNode(parentNode)
		.filter(
			(edge: CanvasEdge) =>
				edge.from.node.id === parentNode.id && edge.to.side === "left"
		);

	let nodes = leftSideEdges.map((edge: CanvasEdge) => edge.to.node);
	let totalHeight = nodes.reduce(
		(acc: number, node: CanvasNode) => acc + node.height + 20,
		0
	);

	nodes.sort((a, b) => a.y - b.y);

	if (nodes.length <= 1) return;
	if (nodes.length > 1 && nodes[0].x === nodes[1]?.x) {
		nodes.forEach((node: CanvasNode, index: number) => {
			const yPos =
				index === 0
					? parentNode.y + parentNode.height / 2 - totalHeight / 2
					: nodes[index - 1].y + nodes[index - 1].height + 20;
			node.moveTo({ x: selectedNode.x, y: yPos });
		});
	}

	canvas.requestSave();
	return newChildNode;
};

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
		document.addEventListener("keydown", (e) => {
			const isKeyRelevantValues = isKeyRelevant(
				e,
				this.app.workspace.editorSuggest.currentSuggest
			);
			if (isKeyRelevantValues) {
				const key = isKeyRelevantValues.key;
				// console.log(key);
				switch (key) {
					case "j":
						e.preventDefault();
						document.dispatchEvent(
							new KeyboardEvent("keydown", {
								key: "ArrowDown",
								code: "ArrowDown",
							})
						);
						break;
					case "k":
						e.preventDefault();
						document.dispatchEvent(
							new KeyboardEvent("keydown", {
								key: "ArrowUp",
								code: "ArrowUp",
							})
						);
						break;

				}
			}
		});
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
			// @ts-ignore
			const canvas = canvasView?.canvas;

			if (!canvasView) return false;
			const patchCanvasView = canvas.constructor;

			const canvasViewunistaller = around(
				canvasView.constructor.prototype,
				{
					onOpen: (next) =>
						async function () {
							if (self.settings.create.createFloat) {
								this.scope.register(["Mod"], "ArrowUp", () => {
									createFloatingNode(this.canvas, "top");
								});
								this.scope.register(
									["Mod"],
									"ArrowDown",
									() => {
										createFloatingNode(
											this.canvas,
											"bottom"
										);
									}
								);
								this.scope.register(
									["Mod"],
									"ArrowLeft",
									() => {
										createFloatingNode(this.canvas, "left");
									}
								);
								this.scope.register(
									["Mod"],
									"ArrowRight",
									() => {
										createFloatingNode(
											this.canvas,
											"right"
										);
									}
								);
							}

							if (self.settings.navigate.useNavigate) {
								const hjklNavigate = (
									direction: "h" | "j" | "k" | "l"
								) => {
									const currentSelection =
										this.canvas.selection;
									if (!currentSelection.isEditing) {
										selectNextNode(
											navigateNode(
												this.canvas,
												direction
											),
											this.app
										);
									}
								};

								// HJKL to select next node
								this.scope.register([], "h", () => {
									hjklNavigate("h");
								});

								this.scope.register([], "j", () => {
									hjklNavigate("j");
								});

								this.scope.register([], "k", () => {
									hjklNavigate("k");
								});

								this.scope.register([], "l", () => {
									hjklNavigate("l");
								});

								// use alt and arrowkeys to select next node
								this.scope.register(
									["Alt"],
									"ArrowLeft",
									() => {
										hjklNavigate("h");
									}
								);

								this.scope.register(
									["Alt"],
									"ArrowDown",
									() => {
										hjklNavigate("j");
									}
								);

								this.scope.register(["Alt"], "ArrowUp", () => {
									hjklNavigate("k");
								});

								this.scope.register(
									["Alt"],
									"ArrowRight",
									() => {
										hjklNavigate("l");
									}
								);
							}

							// use alt HJKL to move node
							this.scope.register(["Alt"], "h", () => {
								let node = this.canvas.selection;
								node.forEach((node: CanvasNode) => {
									node.x -= 10;
									node.moveTo(node);
								});
							});
							this.scope.register(["Alt"], "j", () => {
								let node = this.canvas.selection;
								node.forEach((node: CanvasNode) => {
									node.y += 10;
									node.moveTo(node);
								});
							});
							this.scope.register(["Alt"], "k", () => {
								let node = this.canvas.selection;
								node.forEach((node: CanvasNode) => {
									node.y -= 10;
									node.moveTo(node);
								});
							});
							this.scope.register(["Alt"], "l", () => {
								let node = this.canvas.selection;
								node.forEach((node: CanvasNode) => {
									node.x += 10;
									node.moveTo(node);
								});
							});

							// use Shift HJKL to select multiple nodes
							this.scope.register(
								["Shift"],
								"h",
								async (ev: KeyboardEvent) => {
									const node = await navigateNode(
										this.canvas,
										"h"
									);
									selectNextNodeAndCurrent(node, this.app);
								}
							);

							this.scope.register(
								["Shift"],
								"j",
								async (ev: KeyboardEvent) => {
									const node = await navigateNode(
										this.canvas,
										"j"
									);
									selectNextNodeAndCurrent(node, this.app);
								}
							);

							this.scope.register(
								["Shift"],
								"k",
								async (ev: KeyboardEvent) => {
									const node = await navigateNode(
										this.canvas,
										"k"
									);
									selectNextNodeAndCurrent(node, this.app);
								}
							);

							this.scope.register(
								["Shift"],
								"l",
								async (ev: KeyboardEvent) => {
									const node = await navigateNode(
										this.canvas,
										"l"
									);
									selectNextNodeAndCurrent(node, this.app);
								}
							);

							this.scope.register([], "Enter", async () => {
								const node = await createSiblingNode(
									this.canvas,
									false
								);
								if (!node) return;

								setTimeout(() => {
									const realNode = this.canvas.nodes?.get(
										node.id
									);
									realNode?.startEditing();
									this.canvas.zoomToSelection();
								}, 0);
							});

							this.scope.register(
								[],
								"Tab",
								async (ev: KeyboardEvent) => {
									const node = await createChildNode(
										this.canvas,
										false
									);
									if (!node) return;

									setTimeout(() => {
										const realNode = this.canvas.nodes?.get(
											node.id
										);
										realNode?.startEditing();
										this.canvas.zoomToSelection();
									}, 0);
								}
							);

							// use ctrl enter to edit node, perventing vim mode issue when editing node
							this.scope.register(
								["Ctrl"],
								"Enter",
								async (ev: KeyboardEvent) => {
									let node =
										this.app.workspace.activeLeaf.view.canvas.selection
											.values()
											.next().value;
									let vimState = this.app.isVimEnabled();

									if (vimState) {
										this.app.vault.setConfig(
											"vimMode",
											false
										);
										node.startEditing();
										this.app.vault.setConfig(
											"vimMode",
											true
										);
									} else {
										node.startEditing();
										this.app.vault.setConfig(
											"vimMode",
											true
										);
									}
								}
							);

							// use shift Z to zoom out
							this.scope.register(
								["Shift"],
								"Z",
								async (ev: KeyboardEvent) => {
									this.canvas.zoomBy(-1);
								}
							);

							// add shift S to multiply the node height
							this.scope.register(
								["Shift"],
								"S",
								async (ev: KeyboardEvent) => {
									const selection = this.canvas.selection;
									if (selection.size !== 1) return;
									const node = selection.entries().next()
										.value[1];
									if (node?.label || node?.url) return;
									if (node.isEditing) return;
									node.height *= 2;
									node.moveTo(node);
								}
							);
							// add ctrl S to scale back
							this.scope.register(
								["Ctrl"],
								"S",
								async (ev: KeyboardEvent) => {
									const selection = this.canvas.selection;
									if (selection.size !== 1) return;
									const node = selection.entries().next()
										.value[1];
									if (node?.label || node?.url) return;
									if (node.isEditing) return;
									node.height *= 1 / 2;
									node.moveTo(node);
								}
							);

							// add R key to focus on a node in viewport
							this.scope.register(
								[],
								"r",
								async (ev: KeyboardEvent) => {
									const selection = this.canvas.selection;
									if (selection.size == 0) {
										let lastNode = this.canvas
											.getViewportNodes()
											.last();
										this.canvas.select(lastNode);
										// app.vault.setConfig("vimMode", false);
									}
								}
							);

							return next.call(this);
						},
				}
			);

			const uninstaller = around(patchCanvasView.prototype, {
				onKeydown: (next) =>
					async function (e: any) {
						if (e.key === "Backspace" || e.key === "Delete") {
							if (this.selection.size !== 1) {
								return next.call(this, e);
							}
							const childNode = this.selection.entries().next()
								.value[1];
							if (childNode.isEditing) return;

							const edges = this.getEdgesForNode(
								childNode
							).filter((item: any) => {
								return item.to.node.id === childNode.id;
							});
							if (edges.length === 0) return;
							const parentNode = edges[0].from.node;

							next.call(this, e);

							let wholeHeight = 0;
							let parentEdges = this.getEdgesForNode(
								parentNode
							).filter((item: any) => {
								return (
									item.from.node.id === parentNode.id &&
									item.to.side === "left"
								);
							});

							let allnodes = [];
							for (let i = 0; i < parentEdges.length; i++) {
								let node = parentEdges[i].to.node;
								allnodes.push(node);
								wholeHeight += node.height + 20;
							}
							allnodes.sort((a: any, b: any) => {
								return a.y - b.y;
							});

							// Check if this is a Mindmap
							if (allnodes.length === 1) return;
							if (allnodes.length > 1) {
								if (allnodes[0].x !== allnodes[0].x) {
									return;
								}
							}

							let preNode;
							for (let i = 0; i < allnodes.length; i++) {
								let tempNode;
								if (i === 0) {
									(tempNode = allnodes[i]).moveTo({
										x: childNode.x,
										y:
											parentNode.y +
											parentNode.height -
											wholeHeight / 2,
									});
								} else {
									(tempNode = allnodes[i]).moveTo({
										x: childNode.x,
										y: preNode.y + preNode.height + 20,
									});
								}
								this.requestSave();
								preNode = tempNode;
							}

							this.requestSave();

							this.selectOnly(parentNode);
							this.zoomToSelection();
							parentNode.startEditing();

							return;
						}

						if (e.key === " ") {
							const selection = this.selection;
							if (selection.size !== 1) return;
							const node = selection.entries().next().value[1];

							if (node?.label || node?.url) return;

							if (node.isEditing) return;
							node.startEditing();
						}

						next.call(this, e);
					},
			});
			this.register(uninstaller);
			this.register(canvasViewunistaller);

			canvas?.view.leaf.rebuildView();
			// console.log("Obsidian-Canvas-MindMap: canvas view patched");
			return true;
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
