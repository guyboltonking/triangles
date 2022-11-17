<script lang="ts">
  import { onMount } from "svelte";
  import { EditController } from "./controller.js";
  import { createStateDisplay, ZoomMode } from "./model.js";
  import PlayerEditor from "./PlayerEditor.svelte";
  import PlayerTextEditor from "./PlayerTextEditor.svelte";
  import Playfield from "./Playfield.svelte";
  import { EditingState } from "./view.js";

  let lastLoopTimestamp = 0;
  let fps = "0";

  let frameCallbackId: number;
  let running: boolean = true;

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

  function run() {
    const loop = (timestamp) => {
      let elapsed = timestamp - lastLoopTimestamp;
      lastLoopTimestamp = timestamp;
      if (elapsed != 0) {
        fps = (1000 / elapsed).toFixed();
      }
      state.updatePositions();
      frameCallbackId = requestAnimationFrame(loop);
    };
    loop(lastLoopTimestamp);
    running = true;
  }

  function stop() {
    cancelAnimationFrame(frameCallbackId);
    running = false;
  }

  onMount(() => {
    state.updatePositions();
    run();
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

<div id="controls">
  <button on:click={togglePause}>
    {#if running}⏸{:else}▶️{/if}
  </button>
  <button on:click={editPlayers}> Edit </button>
  Zoom:
  <select bind:value={$zoomMode}>
    <option value={ZoomMode.SCREEN}>Screen</option>
    <option value={ZoomMode.PLAYERS}>Players</option>
  </select>
  {zoom}
  {#if running}FPS: {fps}{/if}
  <PlayerEditor {controller} {editingState} />
</div>

<Playfield id="display" {state} {controller} {editingState} />

{#if showPlayerTextEditor}
  <PlayerTextEditor on:close={() => (showPlayerTextEditor = false)} {state} />
{/if}

<style>
  #controls {
    overflow: hidden;
  }
</style>
