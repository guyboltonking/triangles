import { writable } from "svelte/store";

type PlayerId = number;
const NO_PLAYER: PlayerId = -1;

class Player {
    id: number;
    private _following: [PlayerId, PlayerId] = [null, null];
    //position: Position;
    //targets: [Position, Position];
    speed: number = 1;

    get following(): [Player, Player] {
        return this._following.map(id =>
            id != NO_PLAYER ? this.state.players[id] : null) as [Player, Player];
    }

    isFollowing(): boolean {
        return this._following.every(id => id != NO_PLAYER);
    }

    get position(): Position {
        return this.state.positions[this.id];
    }

    set position(position: Position) {
        this.state.positions[this.id] = position;
    }

    get targets(): [Position, Position] {
        return this.state.targets[this.id];
    }

    set targets(targets: [Position, Position]) {
        this.state.targets[this.id] = targets;
    }

    private state: State;

    constructor(state: State, following: [PlayerId, PlayerId]) {
        this.state = state;
        this._following = following;
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

class Position extends XY {
    static CLOSE_ENOUGH: number = 1;

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
}

class BoundingBox implements ViewBox {
    topLeft: Position = new Position(0, 0);
    bottomRight: Position = new Position(0, 0);

    constructor(position: Position) {
        this.topLeft.x = position.x;
        this.topLeft.y = position.y;
        this.bottomRight.x = position.x;
        this.bottomRight.y = position.y;
    }

    expand(position: Position) {
        this.topLeft.x = Math.min(this.topLeft.x, position.x);
        this.topLeft.y = Math.min(this.topLeft.y, position.y);
        this.bottomRight.x = Math.max(this.bottomRight.x, position.x);
        this.bottomRight.y = Math.max(this.bottomRight.y, position.y);
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

class PlayerDisplay {
    id: number;
    following: [PlayerDisplay, PlayerDisplay] = [null, null];
    position: Position = new Position(0, 0);
    targets: [Position, Position] = [new Position(0, 0), new Position(0, 0)];
    moving(): boolean {
        return this.targets != null && this.position != this.targets[0];
    }
}

export enum ZoomMode {
    SCREEN,
    PLAYERS
}

class StateDisplay {
    width: number = 0;
    height: number = 0;
    margin: number = 10;
    viewBox: ViewBox;
    zoomMode: ZoomMode = ZoomMode.SCREEN;
    state: State;
    playerDisplays: PlayerDisplay[];

    constructor(state: State) {
        this.state = state;
        this.updatePositions();
    }

    updatePositions(): StateDisplay {
        this.state.update();
        this.viewBox = this.calculateViewBox();
        this.updatePlayerDisplays();
        return this;
    }

    updateDisplayDimensions(width: number, height: number): StateDisplay {
        this.width = width;
        this.height = height;
        this.viewBox = this.calculateViewBox();
        return this;
    }

    updateZoomMode(zoomMode: ZoomMode): StateDisplay {
        this.zoomMode = zoomMode;
        this.viewBox = this.calculateViewBox();
        return this;
    }

    players(): PlayerDisplay[] {
        return this.playerDisplays;
    }

    updatePlayerDisplays() {
        if (!this.playerDisplays) {
            this.playerDisplays =
                new Array<PlayerDisplay>(this.state.players.length);
            for (let i in this.state.players) {
                this.playerDisplays[i] = new PlayerDisplay();
                this.playerDisplays[i].id = i;
            }
        }

        for (const player of this.state.players) {
            let playerDisplay = this.playerDisplays[player.id];
            playerDisplay.position = player.position;
            playerDisplay.targets = player.targets;
            player.following.forEach((player, j) => {
                playerDisplay.following[j] = player != null ?
                    this.playerDisplays[player.id] : null;
            });
        }
    }

    private calculateViewBox(): ViewBox {
        if (this.width == 0 || this.height == 0) {
            return new BoundingBox(new Position(0, 0));
        }

        let boundingBox = this.state.calculateBoundingBox();

        boundingBox.expand(
            new Position(
                boundingBox.topLeft.x - this.margin,
                boundingBox.topLeft.y - this.margin));

        boundingBox.expand(
            new Position(
                boundingBox.bottomRight.x + this.margin,
                boundingBox.bottomRight.y + this.margin));

        // Pad the BB to the same aspect ratio as the display

        // Calculate the scaling factor we need to multiple the view by to get
        // display.
        let requiredWidth = this.width;
        let requiredHeight = this.height;

        let viewToDisplayScalingFactor = Math.min(
            this.height / boundingBox.height,
            this.width / boundingBox.width);

        if (this.zoomMode == ZoomMode.PLAYERS || viewToDisplayScalingFactor < 1) {
            requiredWidth = this.width / viewToDisplayScalingFactor;
            requiredHeight = this.height / viewToDisplayScalingFactor;
        }

        boundingBox.topLeft.x -= (requiredWidth - boundingBox.width) / 2;
        boundingBox.bottomRight.x += (requiredWidth - boundingBox.width)
        boundingBox.topLeft.y -= (requiredHeight - boundingBox.height) / 2;
        boundingBox.bottomRight.y += (requiredHeight - boundingBox.height)

        return boundingBox;
    }
}

const SIN60 = Math.sin(Math.PI / 3);

class State {
    players: Player[] = [];
    positions: Position[] = [];
    targets: [Position, Position][] = [];

    addPlayer(following0: PlayerId, following1: PlayerId, x: number, y: number) {
        let player = new Player(this, [following0, following1]);
        player.id = this.players.length;
        // player.position = new Position(x, y);
        this.players.push(player);
        this.positions.push(new Position(x, y));
        this.targets.push(null);
    }

    // Return a tuple of [preferred-target, other-target]
    static calculateTargets(player: Position, a: Position, b: Position): [Position, Position] {
        let ab = Vector.between(a, b);

        if (ab.distance() < Position.CLOSE_ENOUGH) {
            return [a, a];
        }

        let abMid = ab.multiply(0.5);

        let perpDist = ab.distance() * SIN60;
        let abPerp = ab.perpendicular().normalize().multiply(perpDist);

        let target1 = a.add(abMid).add(abPerp);
        let target2 = a.add(abMid).add(abPerp.multiply(-1));

        let target1Distance = Vector.between(player, target1).distance();
        let target2Distance = Vector.between(player, target2).distance();

        // Add a hysteresis zone to stop distances rapidly switching
        return target1Distance < target2Distance + 1 ?
            target1Distance < Position.CLOSE_ENOUGH ?
                [player, target2] : [target1, target2] :
            target2Distance < Position.CLOSE_ENOUGH ?
                [player, target1] : [target2, target1];
    }

    calculateNewTargets() {
        for (const player of this.players) {
            if (player.isFollowing()) {
                player.targets = State.calculateTargets(
                    player.position,
                    player.following[0].position,
                    player.following[1].position,
                );
            }
            else {
                player.targets = null;
            }
        }
    }

    calculateNewPositions() {
        for (const player of this.players) {
            const target = player.targets;
            if (target != null) {
                const targetVector =
                    Vector.between(player.position, target[0]);
                if (targetVector.distance() > player.speed) {
                    player.position =
                        player.position
                            .add(targetVector.normalize().multiply(player.speed));

                }
                else {
                    player.position = target[0];
                }
            }
        }
    }

    update() {
        this.calculateNewTargets();
        this.calculateNewPositions();
    }

    calculateBoundingBox(): BoundingBox {
        let result: BoundingBox = null;
        for (const player of this.players) {
            if (result == null) {
                result = new BoundingBox(player.position);
            }
            else {
                result.expand(player.position);
            }
            if (player.targets != null) {
                result.expand(player.targets[0]);
                result.expand(player.targets[1]);
            }
        }
        return result;
    }
}

let state_ = new State();

state_.addPlayer(1, 2, 1000 / 2, 1000 / 2);
state_.addPlayer(0, 2, 2000 / 2, 1000 / 2);
state_.addPlayer(1, 3, 1000 / 2, 2000 / 2);
state_.addPlayer(0, 4, 3000 / 2, 2000 / 2);
state_.addPlayer(3, 2, 1000 / 2, 2000 / 2);
state_.addPlayer(4, 3, 1000 / 2, 2000 / 2);


const { subscribe, set, update } = writable(new StateDisplay(state_))

export let state = {
    subscribe,
    set,
    updatePositions: () => update(state => state.updatePositions()),
    updateDisplayDimensions: (width: number, height: number) =>
        update(state => state.updateDisplayDimensions(width, height)),
    updateZoomMode: (zoomMode: ZoomMode) => update(state => state.updateZoomMode(zoomMode)),
};