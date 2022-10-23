import { NO_PLAYER, Position, type Player } from "./model";
import type { EditingState } from "./view";

export enum EditorMode {
    EDIT, ADD, DELETE
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
    drag(player: Player, position: Position): ModalController {
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
        return this.editors.editing.click(player);
    }

    mouseOver(player: Player): ModalController {
        this.editingState.selectedPlayer.set(player);
        return this;
    }

    mouseOut(player: Player): ModalController {
        this.editingState.selectedPlayer.set(null);
        return this;
    }
}

class Editing extends ControllerWithEditors {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.DELETE:
                this.editingState.stopEditing();
                return this.editors.deleting;
            case EditorMode.ADD:
                return this.editors.addingEditing;
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
        this.editingState.selectedFollowing(followingIndex, player);
        return this;
    }

    drag(player: Player, position: Position) {
        console.log(`${player.id} drag`)
        return this;
    }
}

class Deleting extends NoSelection {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.EDIT:
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
}

class AddingEditing extends Editing {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.EDIT:
                return this.editors.editing;
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
            case EditorMode.EDIT:
                return this.editors.noSelection;
            case EditorMode.DELETE:
                return this.editors.deleting;
            default:
                return this;
        }
    }

    click(player: Player): ModalController {
        this.editingState.startEditing(player);
        return this.editors.addingEditing;
    }

    clickBackground(position: Position): ModalController {
        return this.editors.addingEditing.clickBackground(position);
    }
}

class Editors {
    noSelection: NoSelection;
    editing: Editing;
    addingEditing: AddingEditing;
    addingNoSelection: AddingNoSelection;
    deleting: Deleting;
}

class DragEditController implements DragEventSink {
    private controller: ModalController;

    constructor(editingState: EditingState) {
        let editors: Editors = new Editors();

        editors.noSelection = new NoSelection(editingState, editors);
        editors.editing = new Editing(editingState, editors);
        editors.addingEditing = new AddingEditing(editingState, editors);
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

    drag(player: Player, position: Position) {
        this.controller = this.controller.drag(player, position);
    }
}

enum DragState {
    NONE, MOUSEDOWN, DRAGGING
}

interface DragEventSink {
    click(player: Player): void;
    drag(player: Player, position: Position): void;
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

        this.dragState = DragState.NONE;
        this.draggedPlayerId = NO_PLAYER;
    }

    mouseMove(player: Player, position: Position) {
        if (this.draggedPlayerId == player.id &&
            (this.dragState == DragState.MOUSEDOWN ||
                this.dragState == DragState.DRAGGING)) {
            this.dragState = DragState.DRAGGING;
            this.dragEventSink.drag(player, position);
        }
        else {
            this.dragState = DragState.NONE;
            this.draggedPlayerId = NO_PLAYER;
        }
    }
}

export class EditController {
    private dragEditController: DragEditController;
    private dragAdaptor: DragAdaptor;
    private domPositionToModelPosition: (event: MouseEvent) => Position;

    constructor(editingState: EditingState) {
        this.dragEditController = new DragEditController(editingState);
        this.dragAdaptor = new DragAdaptor(this.dragEditController);
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
        this.dragEditController.mouseOut(player);
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
}
