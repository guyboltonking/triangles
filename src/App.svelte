<script lang="ts">
  import { onMount } from "svelte";
  import Playfield from "./Playfield.svelte";
  import { state, ZoomMode } from "./triangles.js";

  let lastLoopTimestamp = 0;
  let fps = "0";

  let frameCallbackId: number;
  let running: boolean = true;

  const [finished, zoomMode] = [state.finished, state.zoomMode];

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

  $: {
    if (running && $finished) {
      togglePause();
    }
  }
</script>

<div id="controls">
  <button on:click={togglePause}>
    {#if running}pause{:else}run{/if}
  </button>
  Zoom:
  <select bind:value={$zoomMode}>
    <option value={ZoomMode.SCREEN}>Screen</option>
    <option value={ZoomMode.PLAYERS}>Players</option>
  </select>
  {#if running}FPS: {fps}{/if}

  <!-- <p>{fps}</p> -->
</div>

<Playfield id="display" {state} />
