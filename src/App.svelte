<script lang="ts">
  import { onMount } from "svelte";
  import { state } from "./triangles.js";

  let lastLoop = 0;
  let fps = "";

  onMount(() => {
    let frame;

    const loop = (timestamp) => {
      let elapsed = timestamp - lastLoop;
      lastLoop = timestamp;
      if (elapsed != 0) {
        fps = (1000 / elapsed).toFixed();
      }
      state.tick();
      frame = requestAnimationFrame(loop);
    };

    loop(0);

    return () => cancelAnimationFrame(frame);
  });

  let display;
  let displayWidth = 0;
  let displayHeight = 0;

  onMount(() => {
    displayWidth = display.clientWidth;
    displayHeight = display.clientHeight;

    const resizeObserver = new ResizeObserver((entries) => {
      // We don't care about the entries in this callback; we know it's been
      // updated, just ask the component directly
      displayWidth = display.clientWidth;
      displayHeight = display.clientHeight;
    });

    resizeObserver.observe(display);

    // This callback cleans up the observer
    return () => resizeObserver.unobserve(display);
  });
</script>

<div id="controls">
  <p>{fps}</p>
  <p>{displayWidth}</p>
  <p>{displayHeight}</p>
</div>
<!-- TODO: make the viewBox have the same aspect ratio as the svg -->
<svg
  id="display"
  bind:this={display}
  viewBox="{$state.viewBox.x} {$state.viewBox.y} {$state.viewBox.width} {$state
    .viewBox.height}"
>
  <defs>
    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
      <polyline points="0,100 0,0, 100,0" stroke="red" fill="none" />
    </pattern>
  </defs>
  <rect
    x={$state.viewBox.x}
    y={$state.viewBox.y}
    width={$state.viewBox.width}
    height={$state.viewBox.height}
    fill="url(#grid)"
  />
  {#each $state.positions() as position}
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
