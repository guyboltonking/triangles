import { derived, writable, type Readable, type Writable } from "svelte/store";
import type { Player } from "./model";

class ViewState {
    highlightedPlayer: Writable<Player> = writable(null);
    showFollowingSelectors: Writable<boolean> = writable(false);

    selected(player: Player): Readable<boolean> {
        return derived(
            this.highlightedPlayer,
            highlightedPlayer => player == highlightedPlayer
        );
    }

    following(followingId: number, player: Player): Readable<boolean> {
        return derived(
            this.highlightedPlayer,
            highlightedPlayer => highlightedPlayer?.following[followingId] == player
        );
    }
}

export const viewState = new ViewState();
