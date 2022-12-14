import { NO_PLAYER, Position, type Player } from "./model";
import type { EditingState } from "./view";

export enum EditorMode {
    MODIFY, ADD, DELETE
};

abstract class ModalController {
    protected editingState: EditingState;

    constructor(editingState: EditingState) {
        this.editingState = editingState;
    }

    setMode(editorMode: EditorMode): ModalController {
        return this;
    }
    clickBackground(position: Position): ModalController {
        return this;
    }
    click(player: Player): ModalController {
        return this;
    }
    clickFollowing(followingIndex: number, player: Player): ModalController {
        return this;
    }
    mouseOver(player: Player): ModalController {
        return this;
    }
    mouseOut(player: Player): ModalController {
        return this;
    }
    startDragging(player: Player): ModalController {
        return this;
    }
    drag(player: Player, position: Position): ModalController {
        return this;
    }
    stopDragging(player: Player): ModalController {
        return this;
    }
}



abstract class ControllerWithEditors extends ModalController {
    protected editors: Editors;

    constructor(editingState: EditingState, editors: Editors) {
        super(editingState);
        this.editors = editors;
    }
}

class NoSelection extends ControllerWithEditors {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.DELETE:
                return this.editors.deleting;
            case EditorMode.ADD:
                return this.editors.addingNoSelection;
            default:
                return this;
        }
    }

    click(player: Player): ModalController {
        return this.editors.modifying.click(player);
    }

    mouseOver(player: Player): ModalController {
        this.editingState.selectedPlayer.set(player);
        return this;
    }

    mouseOut(player: Player): ModalController {
        this.editingState.selectedPlayer.set(null);
        return this;
    }

    startDragging(player: Player): ModalController {
        return this.editors.modifying.startDragging(player);
    }
}

class Modifying extends ControllerWithEditors {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.DELETE:
                this.editingState.stopEditing();
                return this.editors.deleting;
            case EditorMode.ADD:
                return this.editors.addingModifying;
            default:
                return this;
        }
    }

    clickBackground(position: Position): ModalController {
        this.editingState.stopEditing();
        return this.editors.noSelection;
    }

    click(player: Player): ModalController {
        this.editingState.startEditing(player);
        return this;
    }

    clickFollowing(followingIndex: number, player: Player): ModalController {
        this.editingState.setSelectedIsFollowing(followingIndex, player);
        return this;
    }

    startDragging(player: Player): ModalController {
        this.editingState.startEditing(player);
        this.editingState.startDragging();
        return this;
    }

    drag(player: Player, position: Position): ModalController {
        this.editingState.setPosition(player, position);
        return this;
    }

    stopDragging(player: Player): ModalController {
        this.editingState.stopDragging();
        return this;
    }
}

class Deleting extends NoSelection {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.MODIFY:
                return this.editors.noSelection;
            case EditorMode.ADD:
                return this.editors.addingNoSelection;
            default:
                return this;
        }
    }

    click(player: Player): ModalController {
        this.editingState.delete(player);
        return this;
    }

    // Block dragging from starting
    startDragging(player: Player): ModalController {
        return this;
    }
}

class AddingModifying extends Modifying {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.MODIFY:
                return this.editors.modifying;
            case EditorMode.DELETE:
                this.editingState.stopEditing();
                return this.editors.deleting;
            default:
                return this;
        }
    }

    clickBackground(position: Position): ModalController {
        this.editingState.stopEditing();
        this.editingState.add(position);
        return this;
    }
}

class AddingNoSelection extends NoSelection {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.MODIFY:
                return this.editors.noSelection;
            case EditorMode.DELETE:
                return this.editors.deleting;
            default:
                return this;
        }
    }

    click(player: Player): ModalController {
        this.editingState.startEditing(player);
        return this.editors.addingModifying;
    }

    clickBackground(position: Position): ModalController {
        return this.editors.addingModifying.clickBackground(position);
    }
}

class Editors {
    noSelection: NoSelection;
    modifying: Modifying;
    addingModifying: AddingModifying;
    addingNoSelection: AddingNoSelection;
    deleting: Deleting;
}

class DragEditController implements DragEventSink {
    private controller: ModalController;

    constructor(editingState: EditingState) {
        let editors: Editors = new Editors();

        editors.noSelection = new NoSelection(editingState, editors);
        editors.modifying = new Modifying(editingState, editors);
        editors.addingModifying = new AddingModifying(editingState, editors);
        editors.addingNoSelection = new AddingNoSelection(editingState, editors);
        editors.deleting = new Deleting(editingState, editors);

        this.controller = editors.noSelection;
    }

    setMode(editorMode: EditorMode) {
        this.controller = this.controller.setMode(editorMode);
    }

    clickBackground(position: Position) {
        this.controller = this.controller.clickBackground(position);
    }

    click(player: Player) {
        this.controller = this.controller.click(player);
    }

    clickFollowing(followingIndex: number, player: Player) {
        this.controller = this.controller.clickFollowing(followingIndex, player);
    }

    mouseOver(player: Player) {
        this.controller = this.controller.mouseOver(player);
    }

    mouseOut(player: Player) {
        this.controller = this.controller.mouseOut(player);
    }

    startDragging(player: Player) {
        this.controller = this.controller.startDragging(player);
    }

    drag(player: Player, position: Position) {
        this.controller = this.controller.drag(player, position);
    }

    stopDragging(player: Player) {
        this.controller = this.controller.stopDragging(player);
    }
}

enum DragState {
    NONE, MOUSEDOWN, DRAGGING
}

interface DragEventSink {
    click(player: Player): void;
    startDragging(player: Player): void;
    drag(player: Player, position: Position): void;
    stopDragging(player: Player): void;
    mouseOut(player: Player): void;
}

class DragAdaptor {
    private dragState: DragState = DragState.NONE;
    private draggedPlayerId: number = NO_PLAYER;
    private dragEventSink: DragEventSink;

    constructor(dragEventSink: DragEventSink) {
        this.dragEventSink = dragEventSink;
    }

    mouseDown(player: Player) {
        this.dragState = DragState.MOUSEDOWN;
        this.draggedPlayerId = player.id;
    }

    mouseUp(player: Player) {
        if (this.dragState == DragState.MOUSEDOWN && this.draggedPlayerId == player.id) {
            this.dragEventSink.click(player);
        }

        if (this.dragState == DragState.DRAGGING && this.draggedPlayerId == player.id) {
            this.dragEventSink.stopDragging(player);
        }

        this.dragState = DragState.NONE;
        this.draggedPlayerId = NO_PLAYER;
    }

    mouseMove(player: Player, position: Position) {
        if (this.draggedPlayerId == player.id &&
            (this.dragState == DragState.MOUSEDOWN ||
                this.dragState == DragState.DRAGGING)) {

            if (this.dragState != DragState.DRAGGING) {
                this.dragEventSink.startDragging(player);
                this.dragState = DragState.DRAGGING;
            }

            this.dragEventSink.drag(player, position);
        }
        else {
            this.dragState = DragState.NONE;
            this.draggedPlayerId = NO_PLAYER;
        }
    }

    mouseOut(player: Player) {
        if (this.draggedPlayerId == player.id &&
            (this.dragState == DragState.MOUSEDOWN || this.dragState == DragState.DRAGGING)) {

            if (this.dragState == DragState.DRAGGING) {
                this.dragEventSink.stopDragging(player);
            }

            this.dragState = DragState.MOUSEDOWN;
            this.draggedPlayerId = NO_PLAYER;
        }
        this.dragEventSink.mouseOut(player);
    }
}

export class EditController {
    private dragEditController: DragEditController;
    private dragAdaptor: DragAdaptor;
    private domPositionToModelPosition: (event: MouseEvent) => Position;
    private editingState: EditingState;

    constructor(editingState: EditingState) {
        this.dragEditController = new DragEditController(editingState);
        this.dragAdaptor = new DragAdaptor(this.dragEditController);
        this.editingState = editingState;
    }

    // Urgh, two-phase construction
    setDomPositionToModelPosition(domPositionToModelPosition: (event: MouseEvent) => Position) {
        this.domPositionToModelPosition = domPositionToModelPosition;
    }

    setMode(editorMode: EditorMode) {
        this.dragEditController.setMode(editorMode);
    }

    clickBackground(event: MouseEvent) {
        this.dragEditController.clickBackground(this.domPositionToModelPosition(event));
    }

    click(player: Player) {
        this.dragEditController.click(player);
    }

    clickFollowing(followingIndex: number, player: Player) {
        this.dragEditController.clickFollowing(followingIndex, player);
    }

    mouseOver(player: Player) {
        this.dragEditController.mouseOver(player);
    }

    mouseOut(player: Player) {
        this.dragAdaptor.mouseOut(player);
    }

    mouseDown(player: Player) {
        this.dragAdaptor.mouseDown(player);
    }

    mouseUp(player: Player) {
        this.dragAdaptor.mouseUp(player);
    }

    mouseMove(player: Player, event: MouseEvent) {
        this.dragAdaptor.mouseMove(player, this.domPositionToModelPosition(event));
    }

    setReactionTime() {
        this.editingState.setReactionTime();
    }
}
