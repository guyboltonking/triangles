<svelte:options namespace="svg" />

<script lang="ts">
    import { readable, type Readable } from "svelte/store";
    import type { ModalController } from "./controller.js";
    import { Player, Vector } from "./model.js";
    import type { EditingState } from "./view.js";

    const arrowWidth = 6;

    export let player: Readable<Player> = null;
    export let controller: ModalController = null;
    export let editingState: EditingState = null;

    let showFollowingSelectors = editingState?.showFollowingSelectors;

    let selected: Readable<boolean> = readable(false);
    let following1: Readable<boolean> = readable(false);
    let following2: Readable<boolean> = readable(false);

    if (player != null) {
        selected = editingState.isSelected($player);
        following1 = editingState.selectedIsFollowing(0, $player);
        following2 = editingState.selectedIsFollowing(1, $player);
    }

    let selectedClass, following1Class, following2Class;
    $: selectedClass = $selected ? "selected" : "";
    $: {
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

    export let displayMode: string;
    export let zoom: number = 1;

    const TEXT_OFFSET = 5;
    const PLAYER_RADIUS = 5;
    const PLAYER_HITBOX_RADIUS = 50;
    const FOLLOWING_SELECTOR_OFFSET = 15;
    const FOLLOWING_HITBOX_RADIUS = 10;
</script>

{#if displayMode == "defs"}
    <marker
        id="arrowhead-selected"
        markerWidth={arrowWidth}
        markerHeight="4"
        refX={arrowWidth}
        refY="2"
        orient="auto"
        stroke-width="0"
        fill="red"
    >
        <polygon points="0 0, {arrowWidth} 2, 0 4" />
    </marker>
    <marker
        id="arrowhead"
        markerWidth={arrowWidth}
        markerHeight="4"
        refX={arrowWidth}
        refY="2"
        orient="auto"
        stroke-width="0"
        fill="pink"
    >
        <polygon points="0 0, {arrowWidth} 2, 0 4" />
    </marker>
{:else if displayMode == "targets" || displayMode == "selection"}
    {#if $player.isFollowing()}
        <g class="target {displayMode} {selectedClass}">
            <polygon
                class="triangle"
                points="
    {$player.target.x},{$player.target.y}
    {$player.following[0].position.x},{$player.following[0].position.y}
    {$player.following[1].position.x},{$player.following[1].position.y}"
                stroke-width="2"
            />
            {#if $player.isMoving()}
                <circle
                    class="target"
                    cx={$player.target.x}
                    cy={$player.target.y}
                    r="5"
                />
                {#if Vector.between($player.position, $player.target).distance() > arrowWidth}
                    <line
                        class="target"
                        x1={$player.position.x}
                        y1={$player.position.y}
                        x2={$player.target.x}
                        y2={$player.target.y}
                        stroke-width="2"
                    />
                {/if}
                <text
                    class="target {selectedClass}"
                    x={$player.target.x - TEXT_OFFSET * 2}
                    y={$player.target.y - TEXT_OFFSET}>{$player.id}</text
                >
            {/if}
        </g>
    {/if}
{:else if displayMode == "player"}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <g
        pointer-events="all"
        on:click={() => controller.click($player)}
        on:mouseover={() => controller.mouseOver($player)}
        on:mouseout={() => controller.mouseOut($player)}
        class="player {selectedClass}"
    >
        <circle
            cx={$player.position.x}
            cy={$player.position.y}
            r={PLAYER_RADIUS}
        />
        <text
            x={$player.position.x + TEXT_OFFSET}
            y={$player.position.y - TEXT_OFFSET}>{$player.id}</text
        >
        <circle
            class="hitbox {selectedClass}"
            cx={$player.position.x}
            cy={$player.position.y}
            r={PLAYER_HITBOX_RADIUS / zoom}
            stroke-width={Math.min(1, 1 / zoom)}
        />
    </g>
    {#if $showFollowingSelectors && !$selected}
        <circle
            pointer-events="all"
            on:click={() => controller.clickFollowing(0, $player)}
            class="following {following1Class}"
            cx={$player.position.x + FOLLOWING_SELECTOR_OFFSET / zoom}
            cy={$player.position.y + FOLLOWING_SELECTOR_OFFSET / zoom}
            r={FOLLOWING_HITBOX_RADIUS / zoom}
            stroke-width={Math.min(1, 1 / zoom)}
        />
        <circle
            pointer-events="all"
            on:click={() => controller.clickFollowing(1, $player)}
            class="following {following2Class}"
            cx={$player.position.x - FOLLOWING_SELECTOR_OFFSET / zoom}
            cy={$player.position.y + FOLLOWING_SELECTOR_OFFSET / zoom}
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

    text {
        cursor: default;
    }
</style>
