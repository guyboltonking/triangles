<svelte:options namespace="svg" />

<script lang="ts">
    import { derived, readable, type Readable } from "svelte/store";
    import type { ModalController } from "./controller.js";
    import { Player, Vector } from "./model.js";
    import { viewState } from "./view.js";

    const arrowWidth = 6;

    export let player: Readable<Player> = null;
    export let controller: ModalController = null;

    let selected: Readable<boolean> = readable(false);

    if (player != null) {
        selected = derived(
            [player, viewState.highlightedPlayer],
            ([player, highlightedPlayer]) => player == highlightedPlayer
        );
    }

    let selectedClass;
    $: selectedClass = $selected ? "selected" : "";

    export let displayMode: string;
    export let zoom: number = 1;
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
                    r="2"
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
                    x={$player.target.x}
                    y={$player.target.y}>{$player.id}</text
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
        <circle cx={$player.position.x} cy={$player.position.y} r="2" />
        <text x={$player.position.x} y={$player.position.y}>{$player.id}</text>
        <circle
            class="hitbox {selectedClass}"
            cx={$player.position.x}
            cy={$player.position.y}
            r={50 / zoom}
        />
    </g>
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

    .target line {
        stroke-dasharray: 5, 2;
    }

    .target.targets circle,
    .target.targets line,
    .target.targets text {
        fill: lightgrey;
    }
    .target.selection circle,
    .target.selection line,
    .target.selection text {
        fill: none;
    }
    .target.selection.selected circle,
    .target.selection.selected line,
    .target.selection.selected text {
        fill: red;
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
