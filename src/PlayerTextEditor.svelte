<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { StateDisplay } from "./model";
    import { bootstrapSizeClass } from "./style";

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
    <textarea class={bootstrapSizeClass("form-control")} bind:value={json} />
    <div class="control-group">
        <button
            class="{bootstrapSizeClass('btn')} btn-secondary"
            on:click={cancel}
        >
            Cancel
        </button>
        <button class="{bootstrapSizeClass('btn')} btn-primary" on:click={save}>
            Save
        </button>
    </div>
</div>

<style>
    .text-editor {
        width: 100%;
        height: 100%;
        position: absolute;
        padding: 1ex;
        z-index: 100;
        background-color: var(--bs-light);
        display: flex;
        flex-flow: column nowrap;
    }

    textarea {
        flex: 1 1 0;
        resize: none;
        overflow: auto;
        font-family: var(--bs-font-monospace);
    }

    .control-group {
        justify-content: flex-end;
        margin-top: 1ex;
    }
</style>
