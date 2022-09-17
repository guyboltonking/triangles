<script lang="ts">
  import { onMount } from "svelte";
  import { state } from "./triangles.js";

  let lastLoop = 0;
  let fps = "";
  let positions = state.positions();

  $: positions = positions;

  onMount(() => {
    let frame;

    const loop = (timestamp) => {
      let elapsed = timestamp - lastLoop;
      lastLoop = timestamp;
      if (elapsed != 0) {
        fps = (1000 / elapsed).toFixed();
      }
      positions = state.positions();
      frame = requestAnimationFrame(loop);
    };

    loop(0);

    return () => cancelAnimationFrame(frame);
  });
</script>

<main>
  <p>{fps}</p>
  <svg>
    {#each positions as position}
      <circle cx={position.x} cy={position.y} r="2" />
    {/each}
  </svg>
</main>

<style>
  svg {
    width: 100%;
  }
</style>
