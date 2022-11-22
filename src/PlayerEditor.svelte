<script lang="ts">
    import type { Readable, Writable } from "svelte/store";
    import { EditController, EditorMode } from "./controller";
    import { trunc, type Position } from "./model";
    import type { EditingState } from "./view";

    export let controller: EditController;
    export let editingState: EditingState;
    let selectedPlayer = editingState.selectedPlayer;
    let position: Readable<Position> = null;
    let speed: Writable<number> = null;

    $: if ($selectedPlayer != null) {
        position = $selectedPlayer.position;
        speed = $selectedPlayer.speed;
    } else {
        position = null;
        speed = null;
    }

    let editorMode: EditorMode = EditorMode.MODIFY;

    $: controller.setMode(editorMode);
</script>

<div id="playerEditor">
    <label>
        <input
            type="radio"
            bind:group={editorMode}
            name="editor"
            value={EditorMode.MODIFY}
        />
        Modify
    </label>

    <label>
        <input
            type="radio"
            bind:group={editorMode}
            name="editor"
            value={EditorMode.ADD}
        />
        Add
    </label>

    <label>
        <input
            type="radio"
            bind:group={editorMode}
            name="editor"
            value={EditorMode.DELETE}
        />
        Delete
    </label>

    <div id="selectedPlayer">
        {#if $selectedPlayer}
            Player {$selectedPlayer.id}: ({trunc($position.x)}, {trunc(
                $position.y
            )}) Speed: <input bind:value={$speed} />
        {:else}
            &nbsp;
        {/if}
    </div>
</div>
