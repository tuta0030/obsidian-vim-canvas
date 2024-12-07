import {App, Canvas, CanvasNode} from "obsidian";
import VimCanvas from "./vimCanvasAndCommandPalette";

export const shortCutFunctions = (
	self: VimCanvas,
	app: App,
	canvas: Canvas,
    lastNode: CanvasNode,
	createFloatingNode:Function,
    createSiblingNode:Function,
    createChildNode:Function,
	selectNextNode:Function,
	navigateNode:Function,
	selectNextNodeAndCurrent:Function
) => {
	if (self.settings.create.createFloat) {
		app.scope.register(["Mod"], "ArrowUp", () => {
			createFloatingNode(canvas, "top");
		});
		app.scope.register(["Mod"], "ArrowDown", () => {
			createFloatingNode(canvas, "bottom");
		});
		app.scope.register(["Mod"], "ArrowLeft", () => {
			createFloatingNode(canvas, "left");
		});
		app.scope.register(["Mod"], "ArrowRight", () => {
			createFloatingNode(canvas, "right");
		});
	}

	if (self.settings.navigate.useNavigate) {
		const hjklNavigate = (direction: "h" | "j" | "k" | "l") => {
			const currentSelection = canvas.selection.values().next().value;
			if (!currentSelection.isEditing) {
				selectNextNode(
					canvas,
					navigateNode(lastNode, canvas, direction),
					app
				);
			}
		};

		// HJKL to select next node
		app.scope.register([], "h", () => {
			hjklNavigate("h");
		});

		app.scope.register([], "j", () => {
			hjklNavigate("j");
		});

		app.scope.register([], "k", () => {
			hjklNavigate("k");
		});

		app.scope.register([], "l", () => {
			hjklNavigate("l");
		});

		// use alt and arrowkeys to select next node
		app.scope.register(["Alt"], "ArrowLeft", () => {
			hjklNavigate("h");
		});

		app.scope.register(["Alt"], "ArrowDown", () => {
			hjklNavigate("j");
		});

		app.scope.register(["Alt"], "ArrowUp", () => {
			hjklNavigate("k");
		});

		app.scope.register(["Alt"], "ArrowRight", () => {
			hjklNavigate("l");
		});
	}

	// use alt HJKL to move node
	app.scope.register(["Alt"], "h", () => {
		let node = canvas.selection;
		node.forEach((node: CanvasNode) => {
			node.x -= 10;
			node.moveTo(node);
		});
	});
	app.scope.register(["Alt"], "j", () => {
		let node = canvas.selection;
		node.forEach((node: CanvasNode) => {
			node.y += 10;
			node.moveTo(node);
		});
	});
	app.scope.register(["Alt"], "k", () => {
		let node = canvas.selection;
		node.forEach((node: CanvasNode) => {
			node.y -= 10;
			node.moveTo(node);
		});
	});
	app.scope.register(["Alt"], "l", () => {
		let node = canvas.selection;
		node.forEach((node: CanvasNode) => {
			node.x += 10;
			node.moveTo(node);
		});
	});

	// use Shift HJKL to select multiple nodes
	app.scope.register(["Shift"], "h", async (ev: KeyboardEvent) => {
		const node = await navigateNode(lastNode, canvas, "h");
		selectNextNodeAndCurrent(canvas, node, app);
	});

	app.scope.register(["Shift"], "j", async (ev: KeyboardEvent) => {
		const node = await navigateNode(lastNode, canvas, "j");
		selectNextNodeAndCurrent(canvas, node, app);
	});

	app.scope.register(["Shift"], "k", async (ev: KeyboardEvent) => {
		const node = await navigateNode(lastNode, canvas, "k");
		selectNextNodeAndCurrent(canvas, node, app);
	});

	app.scope.register(["Shift"], "l", async (ev: KeyboardEvent) => {
		const node = await navigateNode(lastNode, canvas, "l");
		selectNextNodeAndCurrent(canvas, node, app);
	});

	app.scope.register([], "Enter", async () => {
		const node = await createSiblingNode(canvas, false);
		if (!node) return;

		setTimeout(() => {
			const realNode = canvas.nodes?.get(node.id);
			realNode?.startEditing();
			canvas.zoomToSelection();
		}, 0);
	});

	app.scope.register([], "Tab", async (ev: KeyboardEvent) => {
		const node = await createChildNode(canvas, false);
		if (!node) return;

		setTimeout(() => {
			const realNode = canvas.nodes?.get(node.id);
			realNode?.startEditing();
			canvas.zoomToSelection();
		}, 0);
	});

	// use ctrl enter to edit node, perventing vim mode issue when editing node
	app.scope.register(["Ctrl"], "Enter", async (ev: KeyboardEvent) => {
		let node = app.workspace.activeLeaf.view.canvas.selection
			.values()
			.next().value;
		let vimState = app.isVimEnabled();

		if (vimState) {
			app.vault.setConfig("vimMode", false);
			node.startEditing();
			app.vault.setConfig("vimMode", true);
		} else {
			node.startEditing();
			app.vault.setConfig("vimMode", true);
		}
	});

	// use shift Z to zoom out
	app.scope.register(["Shift"], "Z", async (ev: KeyboardEvent) => {
		canvas.zoomBy(-1);
	});

	// add shift S to multiply the node height
	app.scope.register(["Shift"], "S", async (ev: KeyboardEvent) => {
		const selection = canvas.selection;
		if (selection.size !== 1) return;
		const node = selection.entries().next().value[1];
		if (node?.label || node?.url) return;
		if (node.isEditing) return;
		node.height *= 2;
		node.moveTo(node);
	});
	// add ctrl S to scale back
	app.scope.register(["Ctrl"], "S", async (ev: KeyboardEvent) => {
		const selection = canvas.selection;
		if (selection.size !== 1) return;
		const node = selection.entries().next().value[1];
		if (node?.label || node?.url) return;
		if (node.isEditing) return;
		node.height *= 1 / 2;
		node.moveTo(node);
	});

	// add R key to focus on a node in viewport
	app.scope.register([], "r", async (ev: KeyboardEvent) => {
		const selection = canvas.selection;
		if (selection.size == 0) {
			canvas.select(lastNode);
		}
	});
};
