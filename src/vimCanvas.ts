import { App, Plugin, Canvas, CanvasNode } from "obsidian";
import { vimCommandPalette } from "./vimCommandPalette";
import { refocusNode} from "./vimCanvasReFocusNode";
import { navigateNode } from "./vimCanvasNavigateNode";
import { getCanvas } from "./vimCanvasGetCanvas";
import { error } from "console";



// function to navigate between nodes
// function to select nodes
// function to refocus on node
// function to zoom canvas
// setup all shortcuts

function selectAndZoom(canvas: Canvas, node: CanvasNode){
	canvas.deselectAll();
	canvas.select(node);
	canvas.zoomToSelection();
}


export default class VimCanvas extends Plugin {
	app: App;
	async onload() {
		// add commands
		// add refocus command
		this.addCommand({
			id: 'refocus-canvas-node',
			name: 'Refocus canvas node',
			callback: () => refocusNode(this.app),
			hotkeys: [
				{modifiers: [],key: "r"}
			]
		});
		// add navigate nodes command
		(['h', 'j', 'k', 'l'] as const).forEach((key) => {
			this.addCommand({
				id: `navigate-${key}`,
				name: `Navigate ${key.toUpperCase()}`,
				callback: () => {
					let canvas = getCanvas(this.app);
					let lastNode = refocusNode(this.app, false);
					console.log(`Navigate ${key}`);
					console.log(`canvas: ${canvas}, lastNode: ${lastNode}`);
					if (!canvas || !lastNode) return;
					lastNode = navigateNode(lastNode, canvas, key);
					if (!lastNode) return;
					selectAndZoom(canvas, lastNode);
				},
				hotkeys: [{ modifiers: [], key }],
			});
		});

		// 加载完成之后运行的函数
		this.app.workspace.onLayoutReady(() => {
			console.log("Load VimCanvas");
			vimCommandPalette(this.app);
		});
	}

	onunload() {}
}
