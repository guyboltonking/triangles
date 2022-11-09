import { derived, writable, type Readable, type Subscriber, type Unsubscriber, type Writable } from "svelte/store";
import type { Player, Position, StateDisplay } from "./model";
import { extract, Subscriptions } from "./store";

export class EditingState {
    private state: StateDisplay;
    selectedPlayer: Writable<Player> = writable(null);
    showFollowingSelectors: Writable<boolean> = writable(false);
    private dragging: Writable<boolean> = writable(false);

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

    startDragging() {
        this.dragging.set(true);
    }

    stopDragging() {
        this.dragging.set(false);
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

    isSelectable(player: Player): Readable<boolean> {
        return derived(
            [this.selectedPlayer, this.dragging],
            ([selectedPlayer, dragging]) =>
                !dragging || player == selectedPlayer
        );
    }

    selectedIsFollowing(followingIndex: number, player: Player): Readable<boolean> {

        return extract(
            this.selectedPlayer,
            false,
            player => player.following[followingIndex],
            followedPlayer => followedPlayer === player);
    }

    setSelectedIsFollowing(followingIndex: number, followedPlayer: Player) {
        this.selectedPlayer.update(selectedPlayer => {
            if (selectedPlayer) {
                this.state.follow(selectedPlayer.id, followingIndex, followedPlayer.id);
            }
            return selectedPlayer;
        });
    }

    setPosition(player: Player, position: Position) {
        this.state.setPosition(player.id, position)
    }

    add(position: Position) {
        this.startEditing(this.state.addPlayer(position));
    }

    delete(player: Player) {
        this.state.deletePlayer(player.id);
        this.selectedPlayer.set(null);
    }

}
