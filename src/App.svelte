<script lang="ts">
  import { onMount } from "svelte";
  import { EditController } from "./controller.js";
  import { createStateDisplay, ZoomMode } from "./model.js";
  import PlayerEditor from "./PlayerEditor.svelte";
  import PlayerTextEditor from "./PlayerTextEditor.svelte";
  import Playfield from "./Playfield.svelte";
  import { bootstrapSizeClass } from "./style.js";
  import { EditingState } from "./view.js";

  let frameCallbackId: number;
  let running: boolean = false;

  let state = createStateDisplay();
  let editingState = new EditingState(state);

  let controller: EditController = new EditController(editingState);

  const [finished, zoomMode, viewBox] = [
    state.finished,
    state.zoomMode,
    state.viewBox,
  ];

  let zoom: string;
  $: zoom = $viewBox.zoom.toFixed(2);

  let lastLoopTimestamp = -1;
  let fps = 0;

  function run() {
    const loop = (timestamp: DOMHighResTimeStamp) => {
      let elapsed = lastLoopTimestamp == -1 ? 0 : timestamp - lastLoopTimestamp;
      lastLoopTimestamp = timestamp;
      if (elapsed != 0) {
        fps = Math.floor(1000 / elapsed);
        state.updatePositions(elapsed);
      }
      frameCallbackId = requestAnimationFrame(loop);
    };
    loop(lastLoopTimestamp);
    running = true;
  }

  function stop() {
    cancelAnimationFrame(frameCallbackId);
    lastLoopTimestamp = -1;
    fps = 0;
    running = false;
  }

  onMount(() => {
    state.updatePositions(0);
    //run();
    return () => stop();
  });

  function togglePause() {
    if (running) {
      stop();
    } else {
      run();
    }
  }

  let showPlayerTextEditor = false;

  function editPlayers() {
    if (running) {
      stop();
    }
    showPlayerTextEditor = true;
  }

  $: {
    if (running && $finished) {
      togglePause();
    }
  }
</script>

<div id="controls" class="control-group">
  <button
    type="button"
    class="btn-primary {bootstrapSizeClass('btn')}"
    id="play"
    on:click={togglePause}
    title="Play/Pause"
  >
    {#if running}
      <i class="bi-pause-fill" />
    {:else}
      <i class="bi-play-fill" />
    {/if}
  </button>

  <button
    type="button"
    class="btn-primary {bootstrapSizeClass('btn')}"
    on:click={editPlayers}
    title="Edit"
  >
    <i class="bi-pencil-square" />
  </button>

  <div class={bootstrapSizeClass("input-group")} id="zoom">
    <span class="input-group-text label">Zoom</span>
    <select class="form-select" id="zoomMode" bind:value={$zoomMode}>
      <option value={ZoomMode.SCREEN}>Screen</option>
      <option value={ZoomMode.PLAYERS}>Players</option>
    </select>
    <span class="input-group-text value" id="zoomValue">{zoom}</span>
  </div>

  <div class={bootstrapSizeClass("input-group")} id="fps">
    <span class="input-group-text label">FPS</span>
    <input class="form-control value" type="text" bind:value={fps} disabled />
  </div>

  <PlayerEditor {controller} {editingState} />
</div>

<Playfield {state} {controller} {editingState} />

{#if showPlayerTextEditor}
  <PlayerTextEditor on:close={() => (showPlayerTextEditor = false)} {state} />
{/if}
