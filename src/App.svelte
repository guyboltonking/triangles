<script lang="ts">
  import { onMount } from "svelte";
  import { state } from "./triangles.js";

  let lastLoop = 0;
  let fps = "";
  let positions = state.positions();
  let boundingBox = state.boundingBox();

  onMount(() => {
    let frame;

    const loop = (timestamp) => {
      let elapsed = timestamp - lastLoop;
      lastLoop = timestamp;
      if (elapsed != 0) {
        fps = (1000 / elapsed).toFixed();
      }
      positions = state.positions();
      boundingBox = state.boundingBox();
      frame = requestAnimationFrame(loop);
    };

    loop(0);

    return () => cancelAnimationFrame(frame);
  });
</script>

<div id="controls">
  <p>{fps}</p>
</div>
<svg
  id="display"
  viewBox="{boundingBox.origin().x - 10} {boundingBox.origin().y -
    10} {boundingBox.width() + 20} {boundingBox.height() + 20}"
>
  <defs>
    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
      <polyline points="0,100 0,0, 100,0" stroke="red" fill="none" />
    </pattern>
  </defs>
  <rect
    x={boundingBox.origin().x - 10}
    y={boundingBox.origin().y - 10}
    width={boundingBox.width() + 20}
    height={boundingBox.height() + 20}
    fill="url(#grid)"
  />
  {#each positions as position}
    <circle cx={position.x} cy={position.y} r="2" />
  {/each}
</svg>

<style>
  #controls {
    flex: 0 0 auto;
  }

  #display {
    border: solid black 1px;
    /* Don't use auto for the flex-basis: it causes the svg to grow in height to
    suit the aspect ration of the viewBox, causing a nasty constantly resized
    svg. */
    flex: 1 1 0;
  }
</style>