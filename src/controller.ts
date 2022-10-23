import { NO_PLAYER, Position, type Player } from "./model";
import type { EditingState } from "./view";

export enum EditorMode {
    EDIT, ADD, DELETE
};

export abstract class ModalController {
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
    mouseDown(player: Player): ModalController {
        return this;
    }
    mouseUp(player: Player): ModalController {
        return this;
    }
    mouseMove(player: Player, position: Position): ModalController {
        return this;
    }
    drag(player: Player, position: Position): ModalController {
        return this;
    }
}


enum DragState {
    NONE, MOUSEDOWN, DRAGGING
}

abstract class DragInterpretingController extends ModalController {
    private dragState: DragState = DragState.NONE;
    private draggedPlayerId: number = NO_PLAYER;

    mouseDown(player: Player): ModalController {
        this.dragState = DragState.MOUSEDOWN;
        this.draggedPlayerId = player.id;
        return this;
    }

    mouseUp(player: Player): ModalController {
        var result: ModalController = this;

        if (this.dragState == DragState.MOUSEDOWN && this.draggedPlayerId == player.id) {
            result = this.click(player);
        }

        this.dragState = DragState.NONE;
        this.draggedPlayerId = NO_PLAYER;

        return result;
    }

    mouseMove(player: Player, position: Position): ModalController {
        if (this.draggedPlayerId == player.id &&
            (this.dragState == DragState.MOUSEDOWN ||
                this.dragState == DragState.DRAGGING)) {
            this.dragState = DragState.DRAGGING;
            return this.drag(player, position);
        }

        this.dragState = DragState.NONE;
        this.draggedPlayerId = NO_PLAYER;

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

export class EditController extends DragInterpretingController {
    private controller: ModalController;

    constructor(editingState: EditingState) {
        super(editingState);

        let editors: Editors = new Editors();

        editors.noSelection = new NoSelection(editingState, editors);
        editors.editing = new Editing(editingState, editors);
        editors.addingEditing = new AddingEditing(editingState, editors);
        editors.addingNoSelection = new AddingNoSelection(editingState, editors);
        editors.deleting = new Deleting(editingState, editors);

        this.controller = editors.noSelection;
    }

    setMode(editorMode: EditorMode): ModalController {
        this.controller = this.controller.setMode(editorMode);
        return this;
    }

    clickBackground(position: Position): ModalController {
        this.controller = this.controller.clickBackground(position);
        return this;
    }

    click(player: Player): ModalController {
        this.controller = this.controller.click(player);
        return this;
    }

    clickFollowing(followingIndex: number, player: Player): ModalController {
        this.controller = this.controller.clickFollowing(followingIndex, player);
        return this;
    }

    mouseOver(player: Player): ModalController {
        this.controller = this.controller.mouseOver(player);
        return this;
    }

    mouseOut(player: Player): ModalController {
        this.controller = this.controller.mouseOut(player);
        return this;
    }

    drag(player: Player, position: Position) {
        this.controller = this.controller.drag(player, position);
        return this;
    }
}
