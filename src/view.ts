import { derived, writable, type Readable, type Writable } from "svelte/store";
import type { Player, Position, StateDisplay } from "./model";

export class EditingState {
    private state: StateDisplay;
    selectedPlayer: Writable<Player> = writable(null);
    showFollowingSelectors: Writable<boolean> = writable(false);

    constructor(state: StateDisplay) {
        this.state = state;
    }

    startEditing(player: Player) {
        this.selectedPlayer.set(player);
        this.showFollowingSelectors.set(true);
    }

    stopEditing() {
        this.selectedPlayer.set(null);
        this.showFollowingSelectors.set(false);
    }

    highlight(player: Player) {
        this.selectedPlayer.set(player);
    }

    isSelected(player: Player): Readable<boolean> {
        return derived(
            this.selectedPlayer,
            highlightedPlayer => player == highlightedPlayer
        );
    }

    selectedIsFollowing(followingIndex: number, player: Player): Readable<boolean> {
        return derived(
            this.selectedPlayer,
            selectedPlayer => selectedPlayer?.following[followingIndex] == player
        );
    }

    selectedFollowing(followingIndex: number, followedPlayer: Player) {
        this.selectedPlayer.update(selectedPlayer => {
            if (selectedPlayer) {
                this.state.follow(selectedPlayer.id, followingIndex, followedPlayer.id);
            }
            return selectedPlayer;
        });
    }

    add(position: Position) {
        this.startEditing(this.state.addPlayer(position));
    }

    delete(player: Player) {
        this.state.deletePlayer(player.id);
        this.selectedPlayer.set(null);
    }

}
