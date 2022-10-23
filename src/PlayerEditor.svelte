<script lang="ts">
    import { EditController, EditorMode } from "./controller";
    import type { EditingState } from "./view";

    export let controller: EditController;

    let editorMode: EditorMode = EditorMode.EDIT;

    $: controller.setMode(editorMode);
</script>

<label>
    <input
        type="radio"
        bind:group={editorMode}
        name="editor"
        value={EditorMode.EDIT}
    />
    Edit
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
