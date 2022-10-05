<script lang="ts">
    import { EditorMode, type ModalController } from "./controller";
    import type { ViewState } from "./view";

    export let controller: ModalController;

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
