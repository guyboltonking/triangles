<script lang="ts">
    import { Player, Vector } from "./triangles.js";

    const arrowWidth = 6;

    export let player: Player = null;
    export let displayMode: string;
</script>

{#if displayMode == "defs"}
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
{:else if displayMode == "targets"}
    {#if player.isFollowing()}
        <polygon
            points="
    {player.target.x},{player.target.y}
    {player.following[0].position.x},{player.following[0].position.y}
    {player.following[1].position.x},{player.following[1].position.y}"
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
{:else if displayMode == "player"}
    <circle cx={player.position.x} cy={player.position.y} r="2" />
    <text x={player.position.x} y={player.position.y}>{player.id}</text>
{/if}
