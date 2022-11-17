<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { StateDisplay } from "./model";

    export let state: StateDisplay;
    let json = state.export();
    let dispatch = createEventDispatcher();

    function save() {
        state.import(json);
        dispatch("close");
    }

    function cancel() {
        dispatch("close");
    }
</script>

<div class="text-editor">
    <textarea bind:value={json} />
    <div class="controls">
        <button on:click={cancel}>Cancel</button>
        <button on:click={save}>Save</button>
    </div>
</div>

<style>
    .text-editor {
        width: 100%;
        height: 100%;
        position: absolute;
        background-color: white;
        display: flex;
        flex-flow: column nowrap;
    }

    textarea {
        flex: 1 1 0;
        resize: none;
        overflow: auto;
    }

    .controls {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }
</style>
