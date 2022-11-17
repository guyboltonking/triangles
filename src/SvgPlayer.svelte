<svelte:options namespace="svg" />

<script lang="ts">
    import { derived, type Readable } from "svelte/store";
    import type { EditController } from "./controller.js";
    import { Player, Position, StateDisplay, Vector } from "./model.js";
    import type { EditingState } from "./view.js";

    export let arrowWidth: number;

    export let player: Player;
    export let state: StateDisplay;
    export let controller: EditController;
    export let editingState: EditingState;

    let showFollowingSelectors = editingState?.showFollowingSelectors;

    // These all depend on the current value of player, which can change if we
    // import a new set of players.
    let position: Readable<Position>;
    let isMoving: Readable<boolean>;
    let active: Readable<boolean>;
    let followingPosition0: Readable<Position>;
    let followingPosition1: Readable<Position>;
    let target: Readable<Position>;
    let selected: Readable<boolean>;
    let selectable: Readable<boolean>;
    let following1: Readable<boolean>;
    let following2: Readable<boolean>;
    let historyPoints: Readable<string>;

    $: {
        position = player.position;
        isMoving = player.isMoving;
        active = player.active;
        historyPoints = derived(player.history, (history) =>
            history.map((pos) => `${pos.x},${pos.y}`).join(" ")
        );

        followingPosition0 = state.followingPosition(player, 0);
        followingPosition1 = state.followingPosition(player, 1);

        target = player.target;

        selected = editingState.isSelected(player);
        selectable = editingState.isSelectable(player);
        following1 = editingState.selectedIsFollowing(0, player);
        following2 = editingState.selectedIsFollowing(1, player);
    }

    let selectedClass: string, following1Class: string, following2Class: string;
    $: {
        selectedClass = $selected ? "selected" : "";
        if ($following1) {
            following1Class = "selected";
            following2Class = "unselectable";
        } else if ($following2) {
            following1Class = "unselectable";
            following2Class = "selected";
        } else {
            following1Class = "selectable";
            following2Class = "selectable";
        }
    }

    let selectablePointerEvents;
    $: selectablePointerEvents = $selectable ? "all" : "none";

    export let displayMode: string;
    export let zoom: number = 1;

    const TEXT_OFFSET = 5;
    const PLAYER_RADIUS = 5;
    const PLAYER_HITBOX_RADIUS = 50;
    const FOLLOWING_SELECTOR_OFFSET = 15;
    const FOLLOWING_HITBOX_RADIUS = 10;
</script>

{#if displayMode == "history"}
    <polyline class="history" points={$historyPoints} stroke-width="2" />
{:else if displayMode == "targets" || displayMode == "selection"}
    {#if $target != null}
        <g class="target {displayMode} {selectedClass}">
            <polygon
                class="triangle"
                points="
                    {$target.x},{$target.y},
                    {$followingPosition0.x},{$followingPosition0.y},
                    {$followingPosition1.x},{$followingPosition1.y}"
                stroke-width="2"
            />
            {#if $isMoving}
                <circle class="target" cx={$target.x} cy={$target.y} r="5" />
                {#if Vector.between($position, $target).distance() > arrowWidth}
                    <line
                        class="target"
                        x1={$position.x}
                        y1={$position.y}
                        x2={$target.x}
                        y2={$target.y}
                        stroke-width="2"
                    />
                {/if}
                <text
                    class="target {selectedClass}"
                    x={$target.x - TEXT_OFFSET * 2}
                    y={$target.y - TEXT_OFFSET}>{player.id}</text
                >
            {/if}
        </g>
    {/if}
{:else if displayMode == "player" && $active}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <g
        pointer-events={selectablePointerEvents}
        on:mouseover={() => controller.mouseOver(player)}
        on:mouseout={() => controller.mouseOut(player)}
        on:mousedown={() => controller.mouseDown(player)}
        on:mousemove={(event) => controller.mouseMove(player, event)}
        on:mouseup={() => controller.mouseUp(player)}
        class="player {selectedClass}"
    >
        <circle cx={$position.x} cy={$position.y} r={PLAYER_RADIUS} />
        <text x={$position.x + TEXT_OFFSET} y={$position.y - TEXT_OFFSET}
            >{player.id}</text
        >
        <circle
            class="hitbox {selectedClass}"
            cx={$position.x}
            cy={$position.y}
            r={PLAYER_HITBOX_RADIUS / zoom}
            stroke-width={Math.min(1, 1 / zoom)}
        />
    </g>
    {#if $showFollowingSelectors && !$selected}
        <circle
            pointer-events={selectablePointerEvents}
            on:click={() => controller.clickFollowing(0, player)}
            class="following {following1Class}"
            cx={$position.x + FOLLOWING_SELECTOR_OFFSET / zoom}
            cy={$position.y + FOLLOWING_SELECTOR_OFFSET / zoom}
            r={FOLLOWING_HITBOX_RADIUS / zoom}
            stroke-width={Math.min(1, 1 / zoom)}
        />
        <circle
            pointer-events={selectablePointerEvents}
            on:click={() => controller.clickFollowing(1, player)}
            class="following {following2Class}"
            cx={$position.x - FOLLOWING_SELECTOR_OFFSET / zoom}
            cy={$position.y + FOLLOWING_SELECTOR_OFFSET / zoom}
            r={FOLLOWING_HITBOX_RADIUS / zoom}
            stroke-width={Math.min(1, 1 / zoom)}
        />
    {/if}
{/if}

<style>
    .player circle,
    .player text {
        fill: black;
        stroke: none;
    }

    .player circle.hitbox {
        fill: none;
    }

    .player.selected circle.hitbox {
        stroke: blue;
    }

    .following {
        stroke: blue;
        fill: blue;
        fill-opacity: 10%;
    }

    .following.selected {
        fill-opacity: 100%;
    }
    .following.selectable {
        fill-opacity: 10%;
    }
    .following.unselectable {
        fill: none;
        stroke: grey;
    }

    .target line {
        stroke-dasharray: 5, 2;
    }

    .target.targets circle,
    .target.targets line,
    .target.targets text {
        fill: none;
        stroke: lightgrey;
    }
    .target.selection circle,
    .target.selection line,
    .target.selection text {
        fill: none;
        stroke: none;
    }
    .target.selection.selected circle,
    .target.selection.selected line,
    .target.selection.selected text {
        fill: none;
        stroke: red;
    }

    .target .triangle {
        fill: none;
    }
    .target.targets .triangle {
        stroke: lightgrey;
    }
    .target.selection.selected .triangle {
        stroke: none;
    }
    .target.selection.selected .triangle {
        stroke: red;
    }

    .target.targets line {
        stroke: pink;
        marker-end: url(#arrowhead);
    }

    .target.selection.selected line {
        stroke: red;
        marker-end: url(#arrowhead-selected);
    }

    .history {
        fill: none;
        stroke: burlywood;
        stroke-dasharray: 2, 2;
    }

    text {
        cursor: default;
    }
</style>
