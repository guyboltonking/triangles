import type { Player } from "./model";

export interface ModalController {
    clickBackground();
    click(player: Player);
    mouseOver(player: Player);
    mouseOut(player: Player);
}

export class EditController implements ModalController {
    private selectedPlayer: Player = null;

    clickBackground() {
        this.selectedPlayer?.selected.set(false);
        this.selectedPlayer = null;
    }

    click(player: Player) {
        this.selectedPlayer?.selected.set(false);
        this.selectedPlayer = player;
        this.selectedPlayer.selected.set(true);
    }

    mouseOver(player: Player) {
        if (this.selectedPlayer == null) {
            player.selected.set(true);
        }
    }

    mouseOut(player: Player) {
        if (this.selectedPlayer == null) {
            player.selected.set(false);
        }
    }
}
