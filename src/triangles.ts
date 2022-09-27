import { writable } from "svelte/store";

type PlayerId = number;
const NO_PLAYER: PlayerId = -1;

class Player {
    id: number;
    private _following: [PlayerId, PlayerId] = [null, null];
    position: Position;
    target: Position = null;
    speed: number = 1;

    get following(): [Player, Player] {
        return this._following.map(id =>
            id != NO_PLAYER ? this.state.players[id] : null) as [Player, Player];
    }

    isFollowing(): boolean {
        return this._following.every(id => id != NO_PLAYER);
    }

    isMoving(): boolean {
        return this.target != null && this.position != this.target;
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

    static copy(position: Position): Position {
        return new Position(position.x, position.y);
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
}

class BoundingBox implements ViewBox {
    topLeft: Position = null;
    bottomRight: Position = null;

    expand(position: Position): BoundingBox {
        if (this.topLeft == null) {
            this.topLeft = Position.copy(position);
            this.bottomRight = Position.copy(position);
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

class StateDisplay {
    width: number = 0;
    height: number = 0;
    margin: number = 10;
    viewBox: ViewBox;
    zoomMode: ZoomMode = ZoomMode.SCREEN;
    state: State;

    constructor(state: State) {
        this.state = state;
        this.updatePositions();
    }

    updatePositions(): StateDisplay {
        this.state.update();
        this.viewBox = this.calculateViewBox();
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

    players(): Player[] {
        return this.state.players;
    }

    private calculateViewBox(): ViewBox {
        if (this.width == 0 || this.height == 0) {
            return new BoundingBox().expand(new Position(0, 0));
        }

        let boundingBox = this.state.boundingBox;

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
    boundingBox: BoundingBox;

    addPlayer(following0: PlayerId, following1: PlayerId, x: number, y: number) {
        let player = new Player(this, [following0, following1]);
        player.id = this.players.length;
        player.position = new Position(x, y);
        this.players.push(player);
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
                const targets = State.calculateTargets(
                    player.position,
                    player.following[0].position,
                    player.following[1].position,
                );
                targets.forEach(target => this.boundingBox.expand(target));
                player.target = targets[0];
            }
            else {
                player.target = null;
            }
        }
    }

    calculateNewPositions() {
        for (const player of this.players) {
            if (player.target != null) {
                const targetVector =
                    Vector.between(player.position, player.target);
                if (targetVector.distance() > player.speed) {
                    player.position =
                        player.position
                            .add(targetVector.normalize().multiply(player.speed));

                }
                else {
                    player.position = player.target;
                }
            }
            this.boundingBox.expand(player.position);
        }
    }

    update() {
        this.boundingBox = new BoundingBox();
        this.calculateNewTargets();
        this.calculateNewPositions();
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