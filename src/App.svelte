<script lang="ts">
  import { onMount } from "svelte";
  import Playfield from "./Playfield.svelte";
  import { state } from "./triangles.js";

  let displayWidth = 0;
  let displayHeight = 0;
  let lastLoopTimestamp = 0;
  let fps = "";

  onMount(() => {
    let frame;

    const loop = (timestamp) => {
      let elapsed = timestamp - lastLoopTimestamp;
      lastLoopTimestamp = timestamp;
      if (elapsed != 0) {
        fps = (1000 / elapsed).toFixed();
      }
      state.tick();
      frame = requestAnimationFrame(loop);
    };

    loop(0);

    return () => cancelAnimationFrame(frame);
  });
</script>

<div id="controls">
  <p>{fps}</p>
  <p>{displayWidth}</p>
  <p>{displayHeight}</p>
</div>

<!-- TODO: make the viewBox have the same aspect ratio as the svg -->
<Playfield
  bind:width={displayWidth}
  bind:height={displayHeight}
  id="display"
  {state}
/>
