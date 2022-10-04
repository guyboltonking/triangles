import type { Player } from "./model";
import { viewState } from "./view";

export interface ModalController {
    clickBackground(): ModalController;
    click(player: Player): ModalController;
    mouseOver(player: Player): ModalController;
    mouseOut(player: Player): ModalController;
}

class NullController implements ModalController {
    clickBackground(): ModalController {
        return this;
    }
    click(player: Player): ModalController {
        return this;
    }
    mouseOver(player: Player): ModalController {
        return this;
    }
    mouseOut(player: Player): ModalController {
        return this;
    }
}

class Editing extends NullController {
    private static INSTANCE = new Editing();
    private player: Player;

    static instance(player: Player): ModalController {
        viewState.highlightedPlayer.set(player);
        viewState.showFollowingSelectors.set(true);
        return Editing.INSTANCE;
    }

    clickBackground(): ModalController {
        viewState.highlightedPlayer.set(null);
        viewState.showFollowingSelectors.set(false);
        return NoSelection.instance();
    }

    click(player: Player): ModalController {
        viewState.highlightedPlayer.set(player);
        return Editing.instance(player);
    }
}

class NoSelection extends NullController {
    private static INSTANCE = new NoSelection();

    static instance(): ModalController {
        return NoSelection.INSTANCE;
    }

    click(player: Player): ModalController {
        return Editing.instance(player);
    }

    mouseOver(player: Player): ModalController {
        viewState.highlightedPlayer.set(player);
        return this;
    }

    mouseOut(player: Player): ModalController {
        viewState.highlightedPlayer.set(null);
        return this;
    }
}

export class EditController implements ModalController {
    private controller: ModalController = NoSelection.instance();

    clickBackground(): ModalController {
        this.controller = this.controller.clickBackground();
        return this.controller;
    }

    click(player: Player): ModalController {
        this.controller = this.controller.click(player);
        return this.controller;
    }

    mouseOver(player: Player): ModalController {
        this.controller = this.controller.mouseOver(player);
        return this.controller;
    }

    mouseOut(player: Player): ModalController {
        this.controller = this.controller.mouseOut(player);
        return this.controller;
    }
}
