<script lang="ts">
    import { onMount } from "svelte";
    import SvgPlayer from "./SvgPlayer.svelte";
    import { Dimensions, StateDisplay } from "./triangles.js";

    export let state: StateDisplay;
    export let id: string;

    const [dimensions, viewBox, players] = [
        state.dimensions,
        state.viewBox,
        state.players,
    ];

    let display;

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
            <SvgPlayer displayMode="defs" />
        </defs>
        <rect
            x={$viewBox.x}
            y={$viewBox.y}
            width={$viewBox.width}
            height={$viewBox.height}
            fill="url(#grid)"
        />
        {#each $players as player}
            <SvgPlayer displayMode="targets" {player} />
        {/each}
        {#each $players as player}
            <SvgPlayer displayMode="player" {player} />
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
