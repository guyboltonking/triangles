import type { Player } from "./model";
import type { ViewState } from "./view";

export abstract class ModalController {
    protected viewState: ViewState;

    constructor(viewState: ViewState) {
        this.viewState = viewState;
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

class Editing extends ModalController {
    noSelection: NoSelection;

    startEditing(player: Player): ModalController {
        this.viewState.selectedPlayer.set(player);
        this.viewState.showFollowingSelectors.set(true);
        return this;
    }

    clickBackground(): ModalController {
        this.viewState.selectedPlayer.set(null);
        this.viewState.showFollowingSelectors.set(false);
        return this.noSelection;
    }

    click(player: Player): ModalController {
        this.viewState.selectedPlayer.set(player);
        return this.noSelection;
    }

    clickFollowing(followingIndex: number, player: Player): ModalController {
        this.viewState.selectedFollowing(followingIndex, player);
        return this;
    }
}

class NoSelection extends ModalController {
    editing: Editing;

    click(player: Player): ModalController {
        return this.editing.startEditing(player);
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

export class EditController extends ModalController {
    private controller: ModalController;

    constructor(viewState: ViewState) {
        super(viewState);

        let noSelection = new NoSelection(viewState);
        let editing = new Editing(viewState);
        editing.noSelection = noSelection;
        noSelection.editing = editing;

        this.controller = noSelection;
    }

    clickBackground(): ModalController {
        return this.controller = this.controller.clickBackground();
    }

    click(player: Player): ModalController {
        return this.controller = this.controller.click(player);
    }

    clickFollowing(followingIndex: number, player: Player): ModalController {
        return this.controller = this.controller.clickFollowing(followingIndex, player);
    }

    mouseOver(player: Player): ModalController {
        return this.controller = this.controller.mouseOver(player);
    }

    mouseOut(player: Player): ModalController {
        return this.controller = this.controller.mouseOut(player);
    }
}
