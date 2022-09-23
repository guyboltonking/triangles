<script>
    import { onMount } from "svelte";

    export let state;
    export let id;
    let display;
    let width;
    let height;

    $: state.updateDisplayDimensions(width, height);

    // bind:clientWidth/Height is unreliable; use ResizeObserver (because I
    // don't care about old browsers)
    onMount(() => {
        width = display.clientWidth;
        height = display.clientHeight;

        let resizeObserver = new ResizeObserver(() => {
            width = display.clientWidth;
            height = display.clientHeight;
        });

        resizeObserver.observe(display);

        return () => resizeObserver.unobserve(display);
    });
</script>

<div {id} bind:this={display}>
    <svg
        viewBox="{$state.viewBox.x} {$state.viewBox.y} {$state.viewBox
            .width} {$state.viewBox.height}"
    >
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
                markerWidth="6"
                markerHeight="4"
                refX="6"
                refY="2"
                orient="auto"
                stroke-width="0"
                fill="#ccc"
            >
                <polygon points="0 0, 6 2, 0 4" />
            </marker>
        </defs>
        <rect
            x={$state.viewBox.x}
            y={$state.viewBox.y}
            width={$state.viewBox.width}
            height={$state.viewBox.height}
            fill="url(#grid)"
        />
        {#each $state.players() as player}
            {#if player.following[0] && player.following[1]}
                <line
                    x1={player.position.x}
                    y1={player.position.y}
                    x2={player.following[0].position.x}
                    y2={player.following[0].position.y}
                    stroke-width="2"
                    marker-end="url(#arrowhead)"
                    stroke="#ccc"
                />
                <line
                    x1={player.position.x}
                    y1={player.position.y}
                    x2={player.following[1].position.x}
                    y2={player.following[1].position.y}
                    stroke-width="2"
                    marker-end="url(#arrowhead)"
                    stroke="#ccc"
                />
            {/if}
        {/each}
        {#each $state.players() as player}
            <circle cx={player.position.x} cy={player.position.y} r="2" />
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
