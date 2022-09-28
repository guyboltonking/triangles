<script lang="ts">
    import { onMount } from "svelte";
    import { Dimensions, StateDisplay, Vector } from "./triangles.js";

    export let state: StateDisplay;
    export let id: string;

    const [dimensions, viewBox, players] = [
        state.dimensions,
        state.viewBox,
        state.players,
    ];

    let display;
    let arrowWidth = 6;

    // bind:clientWidth/Height is unreliable; use ResizeObserver (because I
    // don't care about old browsers)
    onMount(() => {
        let resizeObserver = new ResizeObserver(() => {
            $dimensions = new Dimensions(
                display.clientWidth,
                display.clientHeight
            );
        });

        resizeObserver.observe(display);

        return () => resizeObserver.unobserve(display);
    });
</script>

<div {id} bind:this={display}>
    <svg viewBox="{$viewBox.x} {$viewBox.y} {$viewBox.width} {$viewBox.height}">
        <defs>
            <pattern
                id="grid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
            >
                <polyline points="0,100 0,0, 100,0" stroke="red" fill="none" />
            </pattern>
            <marker
                id="arrowhead"
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
        </defs>
        <rect
            x={$viewBox.x}
            y={$viewBox.y}
            width={$viewBox.width}
            height={$viewBox.height}
            fill="url(#grid)"
        />
        {#each $players as player}
            {#if player.isFollowing()}
                <polygon
                    points="
                    {player.target.x},{player.target.y}
                    {player.following[0].position.x},{player.following[0]
                        .position.y}
                    {player.following[1].position.x},{player.following[1]
                        .position.y}"
                    stroke-width="2"
                    fill="none"
                    stroke="#ccc"
                />
                {#if player.isMoving()}
                    <circle
                        cx={player.target.x}
                        cy={player.target.y}
                        r="2"
                        fill="red"
                    />
                    {#if Vector.between(player.position, player.target).distance() > arrowWidth}
                        <line
                            x1={player.position.x}
                            y1={player.position.y}
                            x2={player.target.x}
                            y2={player.target.y}
                            stroke-width="2"
                            stroke="red"
                            marker-end="url(#arrowhead)"
                        />
                    {/if}
                    <text x={player.target.x} y={player.target.y} fill="red"
                        >{player.id}</text
                    >
                {/if}
            {/if}
        {/each}
        {#each $players as player}
            <circle cx={player.position.x} cy={player.position.y} r="2" />
            <text x={player.position.x} y={player.position.y}>{player.id}</text>
        {/each}
    </svg>
</div>

<style>
    div {
        display: flex;
        flex-flow: column nowrap;
    }
    svg {
        /* Don't use auto for the flex-basis: it causes the svg to grow in
        height to suit the aspect ration of the viewBox, causing a nasty
        constantly resized svg. */
        flex: 1 1 0;
        border: solid black 1px;
    }
</style>
