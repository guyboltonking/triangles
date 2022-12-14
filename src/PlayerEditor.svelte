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
    let reactionTime: Writable<number> = null;
    let reactionTimeUnsubscribe = () => {};

    $: if ($selectedPlayer != null) {
        position = $selectedPlayer.position;
        speed = $selectedPlayer.speed;
        reactionTime = $selectedPlayer.reactionTime;
        reactionTimeUnsubscribe = reactionTime.subscribe(() =>
            controller.setReactionTime()
        );
    } else {
        position = null;
        speed = null;
        reactionTime = null;
        reactionTimeUnsubscribe();
        reactionTimeUnsubscribe = () => {};
    }

    let editorMode: EditorMode = EditorMode.MODIFY;

    $: controller.setMode(editorMode);
</script>

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

<div id="selectedPlayer" class={bootstrapSizeClass("input-group")}>
    {#if $selectedPlayer}
        <span class="input-group-text label">
            Player {$selectedPlayer.id}
        </span>
        <span class="input-group-text position">
            <div class="coordinate value">
                {trunc($position.x)}
            </div>
            ,
            <div class="coordinate value">
                {trunc($position.y)}
            </div>
        </span>
        <span class="input-group-text label">Speed</span>
        <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            class="form-range form-control"
            bind:value={$speed}
        />
        <span class="input-group-text value">{$speed}</span>
        <span class="input-group-text label">Reaction Time</span>
        <input
            type="range"
            min="0"
            max="10"
            step="1"
            class="form-range form-control"
            bind:value={$reactionTime}
        />
        <span class="input-group-text value">{$reactionTime}</span>
    {:else}
        <span class="input-group-text label" style="visibility: hidden">
            No player selected
        </span>
    {/if}
</div>
