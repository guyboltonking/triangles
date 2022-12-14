import Denque from "denque";
import { derived, writable, type Readable, type Subscriber, type Updater, type Writable } from "svelte/store";
import { extract, Subscriptions } from "./store";

type PlayerId = number;
export const NO_PLAYER: PlayerId = -1;

export function trunc(n: number) {
    return Math.trunc(n);
}

/** Like a writable but with a directly accessible value that can be read
 *  without subscribing and set without triggering */
class WritableValue<T> implements Writable<T> {
    private subscriptions = new Subscriptions<T>();
    value: T;

    constructor(value: T) {
        this.value = value;
    }

    set(value: T) {
        this.value = value;
        this.subscriptions.notify(this.value);
    }

    update(updater: Updater<T>): void {
        this.set(updater(this.value));
    }

    subscribe(subscriber: Subscriber<T>) {
        return this.subscriptions.subscribe(subscriber, this.value);
    }
}

export class Player {
    id: number;
    private _following: [WritableValue<PlayerId>, WritableValue<PlayerId>] = [
        new WritableValue(NO_PLAYER),
        new WritableValue(NO_PLAYER)
    ];
    position: WritableValue<Position> = new WritableValue(null);
    target: WritableValue<Position> = new WritableValue(null);
    speed: WritableValue<number> = new WritableValue(0.5);
    reactionTime: WritableValue<number> = new WritableValue(0);
    perceivedTarget: WritableValue<Position> = new WritableValue(null)
    active = new WritableValue(true);

    // List of [elapsedMillis, Position]
    history: WritableValue<Denque<[number, Position]>> = new WritableValue(new Denque());

    getFollowingIds(): [number, number] {
        return this._following.map(id => id.value) as [number, number];
    }

    private _rawFollowing(state: State, followingId: number): Player {
        return followingId != NO_PLAYER ? state.players[followingId] : null;
    }

    rawFollowing(state: State, followingIndex): Player {
        return this._rawFollowing(state, this._following[followingIndex].value);
    }

    following(state: State, followingIndex: number): Readable<Player> {
        return derived(this._following[followingIndex], id => this._rawFollowing(state, id));
    }

    follow(followingIndex: number, followingPlayerId: PlayerId) {
        if (followingPlayerId != this.id &&
            this._following.every(id => id.value != followingPlayerId)) {
            this._following[followingIndex].set(followingPlayerId);
        }
    }

    stopFollowing(playerId: number): void {
        for (let followingIndex in this._following) {
            if (this._following[followingIndex].value == playerId) {
                this._following[followingIndex].set(NO_PLAYER);
            }
        }
        if (!this.isFollowing()) {
            this.target.set(null);
            this.perceivedTarget.set(null);
        }
    }

    delete() {
        this.active.set(false);
    }

    isFollowing(): boolean {
        return this.active.value && this._following.every(id => id.value != NO_PLAYER);
    }

    static isMovingRaw(active: boolean, target: Position, position: Position): boolean {
        return active &&
            target !== null &&
            !position.equals(target);
    }

    isMoving =
        derived([this.active, this.target, this.position],
            ([active, target, position]) =>
                Player.isMovingRaw(active, target, position));

    constructor(position: Position) {
        this.position.set(position);
    }
}

class XY extends Array<number> {
    constructor(x: number, y: number) {
        super(2)
        this[0] = x;
        this[1] = y;
    }

    get x() { return this[0]; }
    set x(x_: number) { this[0] = x_; }

    get y() { return this[1]; }
    set y(y_: number) { this[1] = y_; }

    equals(other: XY) {
        if (this === other) {
            return true;
        }

        if (this == null || other == null) {
            return false;
        }

        return this[0] == other[0] && this[1] == other[1];
    }
}

export class Dimensions extends XY {
    get width() { return this.x; }
    set width(width: number) { this.x = width; }

    get height() { return this.y; }
    set height(height: number) { this.y = height; }
}

export class Position extends XY {
    static CLOSE_ENOUGH: number = 1;

    clone(): Position {
        return new Position(this.x, this.y);
    }

    add(v: Vector): Position {
        return new Position(this.x + v.x, this.y + v.y);
    }

    closeTo(p: Position) {
        return Vector.between(this, p).distance() < Position.CLOSE_ENOUGH;
    }
}

export class Vector extends XY {
    static between(a: Position, b: Position) {
        return new Vector(b.x - a.x, b.y - a.y);
    }

    multiply(n: number): Vector {
        return new Vector(this.x * n, this.y * n);
    }

    perpendicular(): Vector {
        return new Vector(-this.y, this.x);
    }

    distance(): number {
        return Math.hypot(this.x, this.y);
    }

    normalize(): Vector {
        let dist = this.distance();
        return new Vector(this.x / dist, this.y / dist);
    }
}


export interface ViewBox {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
}

class BoundingBox implements ViewBox {
    topLeft: Position = null;
    bottomRight: Position = null;
    zoom: number = 1;

    clone(): BoundingBox {
        const result = new BoundingBox();
        result.topLeft = this.topLeft.clone();
        result.bottomRight = this.bottomRight.clone();
        result.zoom = this.zoom;
        return result;
    }

    expand(position: Position): BoundingBox {
        if (this.topLeft == null) {
            this.topLeft = position.clone();
            this.bottomRight = position.clone();
        }
        else {
            this.topLeft.x = Math.min(this.topLeft.x, position.x);
            this.topLeft.y = Math.min(this.topLeft.y, position.y);
            this.bottomRight.x = Math.max(this.bottomRight.x, position.x);
            this.bottomRight.y = Math.max(this.bottomRight.y, position.y);
        }
        return this;
    }

    get x(): number {
        return this.topLeft.x;
    }

    get y(): number {
        return this.topLeft.y;
    }

    get width(): number {
        return this.bottomRight.x - this.topLeft.x;
    }

    get height(): number {
        return this.bottomRight.y - this.topLeft.y;
    }
}

export enum ZoomMode {
    SCREEN,
    PLAYERS
}

class Triggerable implements Readable<void> {
    private subscribers: Set<Subscriber<void>> = new Set();

    trigger() {
        this.subscribers.forEach(subscriber => subscriber());
    }

    subscribe(subscriber: Subscriber<void>) {
        this.subscribers.add(subscriber);
        return () => this.subscribers.delete(subscriber);
    }
}

export class StateDisplay {
    private anyPlayerChangedStore: Triggerable = new Triggerable();

    private players_: Writable<Player[]> = writable(null);
    players: Readable<Player[]> = this.players_;

    private updatePlayerStores() {
        this.players_.set(this.state.players);
        this.anyPlayerChangedStore.trigger();
    }

    dimensions: Writable<Dimensions> = writable(new Dimensions(0, 0));
    margin: Writable<number> = writable(10);
    zoomMode: Writable<ZoomMode> = writable(ZoomMode.SCREEN);

    viewBox: Readable<ViewBox>;

    private state: State;

    finished: Readable<boolean>;

    constructor(state: State) {
        this.state = state;
        this.finished = derived(state.moving,
            moving => !moving);
        this.viewBox = derived([
            this.dimensions, this.margin,
            this.zoomMode, this.state.boundingBox
        ], ([dimensions, margin, zoomMode, boundingBox]) =>
            StateDisplay.calculateViewBox(
                dimensions, margin, zoomMode, boundingBox));
        this.updatePlayerStores();
        this.state.update(0);
        this.anyPlayerChangedStore.trigger();
    }

    updatePositions(elapsedMillis): StateDisplay {
        this.state.update(elapsedMillis);
        this.anyPlayerChangedStore.trigger();
        return this;
    }

    follow(playerId: number, followingId: number, followingPlayerId: number) {
        this.state.follow(playerId, followingId, followingPlayerId);
    }

    addPlayer(position: Position): Player {
        let player = this.state.addPlayer(position);
        this.updatePlayerStores();
        return player;
    }

    deletePlayer(playerId: number) {
        this.state.deletePlayer(playerId);
    }

    setPosition(playerId: number, position: Position) {
        this.state.setPosition(playerId, position);
    }

    setReactionTime() {
        this.state.setReactionTime();
    }

    following(player: Player, followingIndex: number) {
        return player.following(this.state, followingIndex);
    }

    followingPosition(player: Player, followingIndex: number) {
        return extract(this.following(player, followingIndex), null, player => player.position, position => position);
    }

    export() {
        return this.state.export();
    }

    import(json: string) {
        this.state.import(json);
        this.updatePlayerStores();
    }

    private static calculateViewBox(
        dimensions: Dimensions,
        margin: number,
        zoomMode: ZoomMode,
        boundingBox: BoundingBox
    ): ViewBox {
        if (dimensions.width == 0 || dimensions.height == 0) {
            return new BoundingBox().expand(new Position(0, 0));
        }

        boundingBox = boundingBox.clone();

        boundingBox.expand(
            new Position(
                boundingBox.topLeft.x - margin,
                boundingBox.topLeft.y - margin));

        boundingBox.expand(
            new Position(
                boundingBox.bottomRight.x + margin,
                boundingBox.bottomRight.y + margin));

        // Pad the BB to the same aspect ratio as the display

        // Calculate the scaling factor we need to multiple the view by to get
        // display.
        let requiredWidth = dimensions.x;
        let requiredHeight = dimensions.y;

        let viewToDisplayScalingFactor = Math.min(
            dimensions.height / boundingBox.height,
            dimensions.width / boundingBox.width);

        if (zoomMode == ZoomMode.PLAYERS || viewToDisplayScalingFactor < 1) {
            requiredWidth = dimensions.width / viewToDisplayScalingFactor;
            requiredHeight = dimensions.height / viewToDisplayScalingFactor;
        }
        else {
            viewToDisplayScalingFactor = 1;
        }

        boundingBox.topLeft.x -= (requiredWidth - boundingBox.width) / 2;
        boundingBox.bottomRight.x += (requiredWidth - boundingBox.width)
        boundingBox.topLeft.y -= (requiredHeight - boundingBox.height) / 2;
        boundingBox.bottomRight.y += (requiredHeight - boundingBox.height)

        boundingBox.zoom = viewToDisplayScalingFactor;

        return boundingBox;
    }
}

const SIN60 = Math.sin(Math.PI / 3);

class State {
    players: Player[] = [];
    historyLength = new WritableValue(2000);
    boundingBox: Writable<BoundingBox> = writable(null);
    moving: Writable<Boolean> = writable(true);

    // Return a tuple of [preferred-target, other-target]
    private static calculateTargets(player: Position, a: Position, b: Position): [Position, Position] {
        let ab = Vector.between(a, b);

        let target1;
        let target2;

        if (ab.distance() < Position.CLOSE_ENOUGH) {
            target1 = a;
            target2 = a;
        }
        else {
            let abMid = ab.multiply(0.5);

            let perpDist = ab.distance() * SIN60;
            let abPerp = ab.perpendicular().normalize().multiply(perpDist);

            target1 = a.add(abMid).add(abPerp);
            target2 = a.add(abMid).add(abPerp.multiply(-1));
        }

        let target1Distance = Vector.between(player, target1).distance();
        let target2Distance = Vector.between(player, target2).distance();

        // Add a hysteresis zone to stop distances rapidly switching
        return target1Distance < target2Distance + 1 ?
            target1Distance < Position.CLOSE_ENOUGH ?
                [player, target2] : [target1, target2] :
            target2Distance < Position.CLOSE_ENOUGH ?
                [player, target1] : [target2, target1];
    }

    private static getHistoricalPosition(player: Player, reactionTimeSeconds: number): Position {
        let reactionTimeMillis = reactionTimeSeconds * 1000;
        let timeInPast = 0;
        let history = player.history.value;
        let pos = player.position.value;
        for (let i = 0; i != history.size() && timeInPast < reactionTimeMillis; ++i) {
            let elapsedMillis: number;
            [elapsedMillis, pos] = history.get(i);
            timeInPast += elapsedMillis;
        }
        return pos;
    }

    private calculateNewTargets(boundingBox: BoundingBox) {
        for (const player of this.players) {
            if (player.isFollowing()) {
                const targets = State.calculateTargets(
                    player.position.value,
                    player.rawFollowing(this, 0).position.value,
                    player.rawFollowing(this, 1).position.value,
                );
                targets.forEach(target => boundingBox?.expand(target));
                player.target.set(targets[0]);

                if (player.reactionTime.value > 0) {
                    const perceivedTargets = State.calculateTargets(
                        player.position.value,
                        State.getHistoricalPosition(player.rawFollowing(this, 0), player.reactionTime.value),
                        State.getHistoricalPosition(player.rawFollowing(this, 1), player.reactionTime.value),
                    );
                    perceivedTargets.forEach(target => boundingBox?.expand(target));
                    player.perceivedTarget.set(perceivedTargets[0]);
                }
                else {
                    player.perceivedTarget.set(player.target.value);
                }
            }
            else {
                player.perceivedTarget.set(null);
                player.target.set(null);
            }
        }
    }

    private calculateNewPositions(elapsedMillis: number, boundingBox: BoundingBox) {
        for (const player of this.players) {
            if (player.perceivedTarget.value != null) {
                const targetVector =
                    Vector.between(player.position.value, player.perceivedTarget.value);
                // All coordinate units are cm; speed is m/s
                let distance = player.speed.value * elapsedMillis / 10;
                if (targetVector.distance() > distance) {
                    player.position.set(
                        player.position.value
                            .add(targetVector.normalize().multiply(distance)));
                }
                else {
                    player.position.set(player.perceivedTarget.value);
                }
                player.history.update(history => {
                    history.unshift([elapsedMillis, player.position.value]);

                    while (history.size() > this.historyLength.value) {
                        history.pop();
                    }

                    return history;
                });
            }
            if (player.active.value) {
                boundingBox?.expand(player.position.value);
            }
        }
    }

    private calculateMoving() {
        this.moving.set(
            this.players.some(player => Player.isMovingRaw(
                player.active.value,
                player.target.value,
                player.position.value)));
    }

    update(elapsedMillis) {
        let boundingBox = new BoundingBox();
        this.calculateNewTargets(boundingBox);
        this.calculateNewPositions(elapsedMillis, boundingBox);
        this.calculateMoving();
        this.boundingBox.set(boundingBox);
    }

    private static _addPlayer(players: Player[], position: Position) {
        let player = new Player(position);
        player.id = players.length;
        players.push(player);
        return player;
    }

    addPlayer(position: Position): Player {
        return State._addPlayer(this.players, position);
    }

    deletePlayer(playerId: number) {
        this.players[playerId].delete();
        this.players.forEach(player => player.stopFollowing(playerId));
    }

    setPosition(playerId: number, position: Position) {
        this.players[playerId].position.set(position);
        this.calculateNewTargets(null);
        this.calculateMoving();
    }

    setReactionTime() {
        this.calculateNewTargets(null);
        this.calculateMoving();
    }

    private static _follow(players: Player[], playerId: number,
        followingIndex: number, followingPlayerId: number) {

        players[playerId].follow(followingIndex, followingPlayerId);
    }

    follow(playerId: number, followingIndex: number, followingPlayerId: number, update = true) {
        State._follow(this.players, playerId, followingIndex, followingPlayerId);
        if (update) {
            this.calculateNewTargets(null);
        }
    }

    export(): string {
        return JSON.stringify(
            {
                "players": this.players
                    .filter(player => player.active.value)
                    .map(player => {
                        return {
                            "id": player.id,
                            "position": player.position.value,
                            "following": player.getFollowingIds(),
                            "speed": player.speed.value,
                            "reactionTime": player.reactionTime.value,
                        }
                    })
            },
            null,
            2
        );
    }

    import(json: string) {
        let playerObjs = JSON.parse(json)["players"];
        let players: Player[] = [];

        playerObjs.sort((a, b) => a.id - b.id);

        let nextPlayerId = 0;
        for (let playerObj of playerObjs) {
            while (nextPlayerId !== playerObj.id) {
                let player = State._addPlayer(players, new Position(0, 0));
                player.active.set(false);
                ++nextPlayerId;
            }
            let player = State._addPlayer(players,
                new Position(...playerObj.position as [number, number]));
            player.speed.set(playerObj.speed);
            player.reactionTime.set(playerObj.reactionTime)
            ++nextPlayerId;
        }

        for (let playerObj of playerObjs) {
            State._follow(players, playerObj.id, 0, playerObj.following[0]);
            State._follow(players, playerObj.id, 1, playerObj.following[1]);
        }

        // We've got here; everything must be good, so assign the new players
        // and recalculate targets.
        this.players = players;
        this.calculateNewTargets(null);
        this.calculateMoving();
    }
}

function addPlayer(state: State, following0: PlayerId, following1: PlayerId, x: number, y: number) {
    let player = state.addPlayer(new Position(x, y));
    state.follow(player.id, 0, following0, false);
    state.follow(player.id, 1, following1, false);
}

export function createStateDisplay(): StateDisplay {
    let state = new State();

    state.import(`
    {
        "players": [
          {
            "id": 1,
            "position": [
              260.5910378250785,
              465.3298415358428
            ],
            "following": [
              2,
              3
            ],
            "speed": 0.5,
            "reactionTime": 0
          },
          {
            "id": 2,
            "position": [
              706.4416749313494,
              -46.95046058239177
            ],
            "following": [
              3,
              1
            ],
            "speed": 0.5,
            "reactionTime": 0
          },
          {
            "id": 3,
            "position": [
              574.132831153548,
              690.6880054906802
            ],
            "following": [
              2,
              1
            ],
            "speed": 0.5,
            "reactionTime": 0
          },
          {
            "id": 4,
            "position": [
              1212.9742350603046,
              586.8272864506247
            ],
            "following": [
              3,
              2
            ],
            "speed": 0.5,
            "reactionTime": 10
          }
        ]
      }
            `)
    // addPlayer(state, 1, 2, 1000 / 2, 1000 / 2);
    // addPlayer(state, 0, 2, 2000 / 2, 1000 / 2);
    // addPlayer(state, 1, 3, 1000 / 2, 2000 / 2);
    // addPlayer(state, 0, 4, 3000 / 2, 2000 / 2);
    // addPlayer(state, 3, 2, 1000 / 2, 2000 / 2);
    // addPlayer(state, 4, 3, 1000 / 2, 2000 / 2);

    return new StateDisplay(state);
}