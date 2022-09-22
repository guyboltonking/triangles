<script lang="ts">
  import { onMount } from "svelte";
  import Playfield from "./Playfield.svelte";
  import { state } from "./triangles.js";

  let lastLoopTimestamp = 0;
  let fps = "";

  onMount(() => {
    let frameCallbackId: number;

    const loop = (timestamp) => {
      let elapsed = timestamp - lastLoopTimestamp;
      lastLoopTimestamp = timestamp;
      if (elapsed != 0) {
        fps = (1000 / elapsed).toFixed();
      }
      state.updatePositions();
      frameCallbackId = requestAnimationFrame(loop);
    };

    loop(0);

    return () => cancelAnimationFrame(frameCallbackId);
  });
</script>

<div id="controls">
  <p>{fps}</p>
  <p>{$state.width}</p>
  <p>{$state.height}</p>
</div>

<!-- TODO: make the viewBox have the same aspect ratio as the svg -->
<Playfield id="display" {state} />
