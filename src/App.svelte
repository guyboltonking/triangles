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

<main>
  <p>{fps}</p>
  <svg
    width="100%"
    height="500px"
    viewBox="{boundingBox.origin().x - 10} {boundingBox.origin().y -
      10} {boundingBox.width() + 20} {boundingBox.height() + 20}"
  >
    {#each positions as position}
      <circle cx={position.x} cy={position.y} r="2" />
    {/each}
  </svg>
</main>

<style>
  svg {
    width: 100%;
    border: solid black 1px;
  }
</style>
