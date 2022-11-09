import { derived, writable, type Readable, type Subscriber, type Writable } from "svelte/store";
import { Subscriptions } from "./store";

type PlayerId = number;
export const NO_PLAYER: PlayerId = -1;

/** Like a writable but with a directly accessible value that can be read
 *  without subscribing and set without triggering */
class ReadableValue<T> implements Readable<T> {
    private subscriptions = new Subscriptions<T>();
    value: T;

    constructor(value: T) {
        this.value = value;
    }

    set(value: T) {
        this.value = value;
        this.subscriptions.notify(this.value);
    }

    subscribe(subscriber: Subscriber<T>) {
        return this.subscriptions.subscribe(subscriber, this.value);
    }
}

export class Player {
    id: number;
    private state: State;
    private _following: [PlayerId, PlayerId] = [NO_PLAYER, NO_PLAYER];
    position: ReadableValue<Position>;
    target: Position = null;
    speed: number = 1;
    private deleted: boolean = false;

    get following(): [Player, Player] {
        return this._following.map(id =>
            id != NO_PLAYER ? this.state.players[id] : null) as [Player, Player];
    }

    follow(followingIndex: number, followingPlayerId: PlayerId) {
        if (followingPlayerId != this.id && this._following.every(id => id != followingPlayerId)) {
            this._following[followingIndex] = followingPlayerId;
        }
    }

    stopFollowing(playerId: number): void {
        for (let followingIndex in this._following) {
            if (this._following[followingIndex] == playerId) {
                this._following[followingIndex] = NO_PLAYER;
            }
        }
    }

    delete() {
        this.deleted = true;
    }

    isFollowing(): boolean {
        return this.isNotDeleted() && this._following.every(id => id != NO_PLAYER);
    }

    isMoving(): boolean {
        return this.isNotDeleted() && this.target != null && this.position.value != this.target;
    }

    isNotDeleted(): boolean {
        return !this.deleted;
    }

    constructor(state: State, position: Position) {
        this.state = state;
        this.position = new ReadableValue(position);
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

    private playerStores: Writable<Player>[] = [];
    private anyPlayerChangedStore: Triggerable = new Triggerable();

    private players_: Writable<Readable<Player>[]> = writable(this.playerStores);
    players: Readable<Readable<Player>[]> = this.players_;

    finished: Readable<boolean> = derived(this.anyPlayerChangedStore, () =>
        this.state.players.every(player => !player.isMoving())
    );

    private updatePlayerStores() {
        // playerStores length will always be <= players length i.e. we can only
        // grow
        for (let i = this.playerStores.length; i < this.state.players.length; ++i) {
            this.playerStores.push(writable(this.state.players[i]));
        }
        this.players_.set(this.playerStores);
        this.anyPlayerChangedStore.trigger();
    }

    private updatePlayers() {
        this.state.players.forEach(player => this.playerStores[player.id].set(player));
        this.anyPlayerChangedStore.trigger();
    }

    dimensions: Writable<Dimensions> = writable(new Dimensions(0, 0));
    margin: Writable<number> = writable(10);
    zoomMode: Writable<ZoomMode> = writable(ZoomMode.SCREEN);

    viewBox: Readable<ViewBox> = derived([
        this.dimensions, this.margin, this.zoomMode, this.anyPlayerChangedStore
    ], ([dimensions, margin, zoomMode, _]) =>
        StateDisplay.calculateViewBox(
            dimensions, margin, zoomMode, this.state.boundingBox));

    private state: State;

    constructor(state: State) {
        this.state = state;
        this.updatePlayerStores();
        this.state.update();
    }

    updatePositions(): StateDisplay {
        this.state.update();
        this.updatePlayers();
        return this;
    }

    follow(playerId: number, followingId: number, followingPlayerId: number) {
        this.state.follow(playerId, followingId, followingPlayerId);
        this.updatePlayers();
    }

    addPlayer(position: Position): Player {
        let player = this.state.addPlayer(position);
        this.updatePlayerStores();
        return player;
    }

    deletePlayer(playerId: number) {
        this.state.deletePlayer(playerId);
        this.updatePlayers();
    }

    setPosition(playerId: number, position: Position) {
        this.state.setPosition(playerId, position);
        this.updatePlayers();
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
    boundingBox: BoundingBox;

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

    private calculateNewTargets(boundingBox: BoundingBox) {
        for (const player of this.players) {
            if (player.isFollowing()) {
                const targets = State.calculateTargets(
                    player.position.value,
                    player.following[0].position.value,
                    player.following[1].position.value,
                );
                targets.forEach(target => boundingBox?.expand(target));
                player.target = targets[0];
            }
            else {
                player.target = null;
            }
        }
    }

    private calculateNewPositions(boundingBox: BoundingBox) {
        for (const player of this.players) {
            if (player.target != null) {
                const targetVector =
                    Vector.between(player.position.value, player.target);
                if (targetVector.distance() > player.speed) {
                    player.position.set(
                        player.position.value
                            .add(targetVector.normalize().multiply(player.speed)));

                }
                else {
                    player.position.value = player.target;
                }
            }
            if (player.isNotDeleted()) {
                boundingBox?.expand(player.position.value);
            }
        }
    }

    update() {
        this.boundingBox = new BoundingBox();
        this.calculateNewTargets(this.boundingBox);
        this.calculateNewPositions(this.boundingBox);
    }

    addPlayer(position: Position): Player {
        let player = new Player(this, position);
        player.id = this.players.length;
        this.players.push(player);
        return player;
    }

    deletePlayer(playerId: number) {
        this.players[playerId].delete();
        this.players.forEach(player => player.stopFollowing(playerId));
    }

    setPosition(playerId: number, position: Position) {
        this.players[playerId].position.set(position);
        this.calculateNewTargets(null);
    }

    follow(playerId: number, followingIndex: number, followingPlayerId: number, update = true) {
        this.players[playerId].follow(followingIndex, followingPlayerId);
        if (update) {
            this.calculateNewTargets(null);
        }
    }
}

function addPlayer(state: State, following0: PlayerId, following1: PlayerId, x: number, y: number) {
    let player = state.addPlayer(new Position(x, y));
    state.follow(player.id, 0, following0, false);
    state.follow(player.id, 1, following1, false);
}

export function createStateDisplay(): StateDisplay {
    let state = new State();

    addPlayer(state, 1, 2, 1000 / 2, 1000 / 2);
    addPlayer(state, 0, 2, 2000 / 2, 1000 / 2);
    addPlayer(state, 1, 3, 1000 / 2, 2000 / 2);
    addPlayer(state, 0, 4, 3000 / 2, 2000 / 2);
    addPlayer(state, 3, 2, 1000 / 2, 2000 / 2);
    addPlayer(state, 4, 3, 1000 / 2, 2000 / 2);

    return new StateDisplay(state);
}