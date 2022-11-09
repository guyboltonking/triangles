<svelte:options namespace="svg" />

<script lang="ts">
    export let arrowWidth: number;
</script>

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
