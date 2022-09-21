<script>
    export let state;
    export let id;
    let width;
    let height;

    $: state.updateDisplayDimensions(width, height);
</script>

<div {id} bind:clientWidth={width} bind:clientHeight={height}>
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
        </defs>
        <rect
            x={$state.viewBox.x}
            y={$state.viewBox.y}
            width={$state.viewBox.width}
            height={$state.viewBox.height}
            fill="url(#grid)"
        />
        {#each $state.positions() as position}
            <circle cx={position.x} cy={position.y} r="2" />
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
