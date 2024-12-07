import { around } from "monkey-around";

export const uninstaller = (patchCanvasView) => {
	around(patchCanvasView.prototype, {
		onKeydown: (next) =>
			async function (e: any) {
				if (e.key === "Backspace" || e.key === "Delete") {
					if (this.selection.size !== 1) {
						return next.call(this, e);
					}
					const childNode = this.selection.entries().next().value[1];
					if (childNode.isEditing) return;

					const edges = this.getEdgesForNode(childNode).filter(
						(item: any) => {
							return item.to.node.id === childNode.id;
						}
					);
					if (edges.length === 0) return;
					const parentNode = edges[0].from.node;

					next.call(this, e);

					let wholeHeight = 0;
					let parentEdges = this.getEdgesForNode(parentNode).filter(
						(item: any) => {
							return (
								item.from.node.id === parentNode.id &&
								item.to.side === "left"
							);
						}
					);

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
};

export const canvasViewunistaller = (
	canvasView,
	shortCutFunctions,
	createFloatingNode,
	selectNextNode,
	navigateNode,
	selectNextNodeAndCurrent
) => {
	around(canvasView.constructor.prototype, {
		onOpen: (next) =>
			async function () {
				shortCutFunctions(
					self,
					createFloatingNode,
					selectNextNode,
					navigateNode,
					selectNextNodeAndCurrent
				);

				return next.call(this);
			},
	});
};
