import { derived, writable, type Readable, type Writable } from "svelte/store";
import { state, type Player, type StateDisplay } from "./model";

class ViewState {
    private state: StateDisplay;
    selectedPlayer: Writable<Player> = writable(null);
    showFollowingSelectors: Writable<boolean> = writable(false);

    constructor(state: StateDisplay) {
        this.state = state;
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
                state.follow(selectedPlayer.id, followingIndex, followedPlayer.id);
            }
            return selectedPlayer;
        });
    }

}

export const viewState = new ViewState(state);
