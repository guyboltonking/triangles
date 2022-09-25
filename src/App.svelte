<script lang="ts">
  import { onMount } from "svelte";
  import Playfield from "./Playfield.svelte";
  import { state } from "./triangles.js";

  let lastLoopTimestamp = 0;
  let fps = "";

  let frameCallbackId: number;
  let running: boolean;

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

  let runningOrPaused = "pause";

  function togglePause() {
    if (running) {
      stop();
    } else {
      run();
    }
  }
</script>

<div id="controls">
  <button on:click={togglePause}
    >{#if running}pause{:else}run{/if}</button
  >
  <!-- <p>{fps}</p> -->
</div>

<Playfield id="display" {state} />
