<script lang="ts">
    import type { Readable, Writable } from "svelte/store";
    import { EditController, EditorMode } from "./controller";
    import { trunc, type Position } from "./model";
    import { bootstrapSizeClass } from "./style";
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

<div id="playerEditor" class="control-group">
    <div class={bootstrapSizeClass("btn-group")} role="group">
        <input
            id="editorModeModify"
            class="btn-check"
            type="radio"
            bind:group={editorMode}
            name="editor"
            value={EditorMode.MODIFY}
        />
        <label class="btn btn-outline-primary" for="editorModeModify">
            Modify
        </label>

        <input
            id="editorModeAdd"
            class="btn-check"
            type="radio"
            bind:group={editorMode}
            name="editor"
            value={EditorMode.ADD}
        />
        <label class="btn btn-outline-primary" for="editorModeAdd"> Add </label>

        <input
            id="editorModeDelete"
            class="btn-check"
            type="radio"
            bind:group={editorMode}
            name="editor"
            value={EditorMode.DELETE}
        />
        <label class="btn btn-outline-primary" for="editorModeDelete">
            Delete
        </label>
    </div>

    <div id="selectedPlayer" class="control">
        {#if $selectedPlayer}
            <div class="id">Player {$selectedPlayer.id}:</div>
            <div class="position control">
                <div class="coordinate">
                    {trunc($position.x)}
                </div>
                ,
                <div class="coordinate">
                    {trunc($position.y)}
                </div>
            </div>
            <div class="speed">
                <label>Speed <input bind:value={$speed} /></label>
            </div>
        {:else}
            &nbsp;
        {/if}
    </div>
</div>
