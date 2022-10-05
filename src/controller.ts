import { Position, type Player } from "./model";
import type { ViewState } from "./view";

export enum EditorMode {
    EDIT, ADD, DELETE
};

export abstract class ModalController {
    protected viewState: ViewState;

    constructor(viewState: ViewState) {
        this.viewState = viewState;
    }

    setMode(editorMode: EditorMode): ModalController {
        return this;
    }
    clickBackground(): ModalController {
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
}

abstract class ControllerWithEditors extends ModalController {
    protected editors: Editors;

    constructor(viewState: ViewState, editors: Editors) {
        super(viewState);
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
        this.viewState.selectedPlayer.set(player);
        return this;
    }

    mouseOut(player: Player): ModalController {
        this.viewState.selectedPlayer.set(null);
        return this;
    }
}

class Editing extends ControllerWithEditors {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.DELETE:
                this.viewState.stopEditing();
                return this.editors.deleting;
            case EditorMode.ADD:
                return this.editors.addingEditing;
            default:
                return this;
        }
    }

    clickBackground(): ModalController {
        this.viewState.stopEditing();
        return this.editors.noSelection;
    }

    click(player: Player): ModalController {
        this.viewState.startEditing(player);
        return this;
    }

    clickFollowing(followingIndex: number, player: Player): ModalController {
        this.viewState.selectedFollowing(followingIndex, player);
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
        this.viewState.delete(player);
        return this;
    }
}

class AddingEditing extends Editing {
    setMode(editorMode: EditorMode): ModalController {
        switch (editorMode) {
            case EditorMode.EDIT:
                return this.editors.editing;
            case EditorMode.DELETE:
                this.viewState.stopEditing();
                return this.editors.deleting;
            default:
                return this;
        }
    }

    clickBackground(/* TODO position */): ModalController {
        this.viewState.stopEditing();
        this.viewState.add(new Position(0, 0));
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
        this.viewState.startEditing(player);
        return this.editors.addingEditing;
    }

    clickBackground(/* TODO position */): ModalController {
        return this.editors.addingEditing.clickBackground();
    }
}

class Editors {
    noSelection: NoSelection;
    editing: Editing;
    addingEditing: AddingEditing;
    addingNoSelection: AddingNoSelection;
    deleting: Deleting;
}

export class EditController extends ModalController {
    private controller: ModalController;

    constructor(viewState: ViewState) {
        super(viewState);

        let editors: Editors = new Editors();

        editors.noSelection = new NoSelection(viewState, editors);
        editors.editing = new Editing(viewState, editors);
        editors.addingEditing = new AddingEditing(viewState, editors);
        editors.addingNoSelection = new AddingNoSelection(viewState, editors);
        editors.deleting = new Deleting(viewState, editors);

        this.controller = editors.noSelection;
    }

    setMode(editorMode: EditorMode): ModalController {
        this.controller = this.controller.setMode(editorMode);
        return this;
    }

    clickBackground(): ModalController {
        this.controller = this.controller.clickBackground();
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
}
