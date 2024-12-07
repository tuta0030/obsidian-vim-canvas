import { App, CanvasNode, Plugin, TFile, ItemView, Canvas } from "obsidian";
import { around } from "monkey-around";
import {
	createSiblingNode,
	createChildNode,
	createFloatingNode,
} from "./createEdgeAndNodes";
import { navigateNode } from "./navigateNode";
import { selectNextNode, selectNextNodeAndCurrent } from "./selectNodes";
import { vimCommandPalette } from "./vimCommandPalette";
import { hjklNavigate, hjklMoveNode } from "./shortCuts";


export default class VimCanvas extends Plugin {
	app: App;

	async onload() {
		this.vimCommandPalette();
	}

	onunload() {}

	vimCommandPalette() {
		vimCommandPalette(this.app);
	}


}
