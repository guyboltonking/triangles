<script lang="ts">
    import { onMount } from "svelte";
    import type { EditController } from "./controller";
    import { Dimensions, Position, StateDisplay } from "./model.js";
    import SvgPlayer from "./SvgPlayer.svelte";
    import SvgPlayerDefs from "./SvgPlayerDefs.svelte";
    import type { EditingState } from "./view";

    export let state: StateDisplay;
    export let controller: EditController;
    export let editingState: EditingState;

    const [dimensions, viewBox, players] = [
        state.dimensions,
        state.viewBox,
        state.players,
    ];

    let zoom: number;
    $: zoom = $viewBox.zoom;

    let display: Element;
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

    let svg: SVGSVGElement;

    function domPositionToModelPosition(event: MouseEvent): Position {
        let domPoint = new DOMPoint();
        domPoint.x = event.clientX;
        domPoint.y = event.clientY;

        let svgPoint = domPoint.matrixTransform(svg.getScreenCTM().inverse());
        return new Position(svgPoint.x, svgPoint.y);
    }

    controller.setDomPositionToModelPosition(domPositionToModelPosition);
</script>

<div id="display" bind:this={display}>
    <svg
        bind:this={svg}
        viewBox="{$viewBox.x} {$viewBox.y} {$viewBox.width} {$viewBox.height}"
    >
        <defs>
            <pattern
                id="grid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
            >
                <polyline
                    points="0,100 0,0, 100,0"
                    stroke="lightgreen"
                    fill="none"
                />
            </pattern>
            <SvgPlayerDefs {arrowWidth} />
        </defs>
        <rect
            x={$viewBox.x}
            y={$viewBox.y}
            width={$viewBox.width}
            height={$viewBox.height}
            fill="url(#grid)"
            on:click={(event) => controller.clickBackground(event)}
        />
        {#each $players as player}
            <SvgPlayer
                displayMode="history"
                {player}
                {controller}
                {editingState}
                {state}
                {arrowWidth}
            />
        {/each}
        {#each $players as player}
            <SvgPlayer
                displayMode="targets"
                {player}
                {controller}
                {editingState}
                {state}
                {arrowWidth}
            />
        {/each}
        {#each $players as player}
            <SvgPlayer
                displayMode="selection"
                {player}
                {controller}
                {editingState}
                {state}
                {arrowWidth}
            />
        {/each}
        {#each $players as player}
            <SvgPlayer
                displayMode="player"
                {player}
                {controller}
                {editingState}
                {arrowWidth}
                {state}
                {zoom}
            />
        {/each}
    </svg>
</div>
