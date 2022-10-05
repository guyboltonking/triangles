import type { Player } from "./model";
import { viewState } from "./view";

export abstract class ModalController {
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
    private static INSTANCE = new Editing();

    static instance(player: Player): ModalController {
        viewState.selectedPlayer.set(player);
        viewState.showFollowingSelectors.set(true);
        return Editing.INSTANCE;
    }

    clickBackground(): ModalController {
        viewState.selectedPlayer.set(null);
        viewState.showFollowingSelectors.set(false);
        return NoSelection.instance();
    }

    click(player: Player): ModalController {
        viewState.selectedPlayer.set(player);
        return Editing.instance(player);
    }

    clickFollowing(followingIndex: number, player: Player): ModalController {
        viewState.selectedFollowing(followingIndex, player);
        return this;
    }
}

class NoSelection extends ModalController {
    private static INSTANCE = new NoSelection();

    static instance(): ModalController {
        return NoSelection.INSTANCE;
    }

    click(player: Player): ModalController {
        return Editing.instance(player);
    }

    mouseOver(player: Player): ModalController {
        viewState.selectedPlayer.set(player);
        return this;
    }

    mouseOut(player: Player): ModalController {
        viewState.selectedPlayer.set(null);
        return this;
    }
}

export class EditController extends ModalController {
    private controller: ModalController = NoSelection.instance();

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
