# Triangles

This simulates a thing you may have heard of, which goes like this:

* Get a bunch of folk together in an open space;
* Each person chooses two other people to follow;
* Once things get moving, each person must try to position such that they form an apex of an equilateral triangle formed by themselves and the two people they are following;
* Things get moving.

What happens?

The point of the simulation is to try and answer that question.  It isn't to stop you from doing the thing, which you definitely should do, because it's fun.

# Caveats

* Mobile/touch unfriendly: sorry, mouse needed at the moment;
* Floating point rounding errors can cause odd behaviour at small distances; in particular, when players all end up near the same position they can end up jiggling about forever, or ending up in a state where they all head off in different directions (at which point the simulation is correct, but the state it went through to get there should arguably not happen).

# Usage

The display is split up into a **controls** area at the top and a **playfield** at the bottom.

## Playfield

This shows:

* A grid of 1m squares;
* Players, represented by black discs with the player number next to them;
* Targets: where each player is trying to get to to make a triangle with the players they are following.  These are represented by a red circle with the player number next to it, with a red dotted arrow from the player to the target;
* Triangles: the triangles that would be made once each player reaches their target;
* Paths: a brown dashed line showing where the player has been.  This is currently keeps 17 seconds-worth of positions; positions older than that will disappear.

The simulation starts with a pre-loaded set of players.

Hovering the cursor over a player will highlight the triangle, the target and the track to the target.

The playfield is automatically zoomed and panned to keep all players and targets in view.

## Controls

The controls are in a continuous row that will wrap depending on the width of the screen; from left-to-right these are:

* The play/pause button starts and stops the simulation;
* The edit button shows the player data in JSON format; you can edit it (using the **Save** button to save it, or **Cancel** to abandon changes; sorry, there is no help if you create invalid data!), and/or copy and paste it somewhere to save "interesting" states;
* **Zoom** controls how the Playfield is auto-zoomed to keep all the players in view: you can either tell the system to keep them in view until the zoom level is 1 pixel-per-cm (Screen), or keep zooming to keep all the players in view (Players); the current zoom level is also show;
* **FPS** just shows how many frames-per-second the simulation is managing;
* The editing mode controls how mouse clicks work:
  * **Modify**: Clicking on a player will show the player editing controls (see below); clicking on the background will deselect the player; dragging a player will change its position;
  * **Add**: Like Modify, except that a click on the background will create a new player;
  * **Delete**: Clicking a player will delete it;
  * Note that deleting a player removes that player's number from use; new players will not end up with that number.
* Player editing controls:
  * When a player is selected, the players they are following are indicated by filled blue circles underneath those players;
  * You can change which players are being followed by clicking on the blue circles under the players; there are two circles: this allows you to select the first player followed by clicking on the left circle, and the second by clicking on the right;
  * If a player isn't following two other players, they won't move;
  * As already mentioned, dragging a player changes the position;
  * **Speed** controls how fast (in m/s) each player moves towards their target; once they've reached the target, they'll keep pace with it as long as the target is moving slower than the player speed;
  * **Reaction Time** (in seconds) is how fast the player responds to movements of the players being followed; this is modelled by calculating the target based on the position of the followed players that many seconds ago.

To reset everything, reload the page.