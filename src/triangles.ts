import { writable } from "svelte/store";

type PlayerId = number;
const NO_PLAYER: PlayerId = -1;
class Player {
    following: [PlayerId, PlayerId] = [NO_PLAYER, NO_PLAYER];
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
    add(v: Vector): Position {
        return new Position(this.x + v.x, this.y + v.y);
    }
}

class Vector extends XY {
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
    target: Position = new Position(0, 0);
}

class StateDisplay {
    width: number = 0;
    height: number = 0;
    margin: number = 10;
    viewBox: ViewBox;
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

        this.state.positions.forEach((position, playerIndex) => {
            let playerDisplay = this.playerDisplays[playerIndex];
            playerDisplay.position = position;
            playerDisplay.target = this.state.targets[playerIndex];
            this.state.players[playerIndex].following.forEach((playerId, j) => {
                playerDisplay.following[j] = playerId == NO_PLAYER ?
                    null :
                    this.playerDisplays[playerId];
            });
        });
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

        if (viewToDisplayScalingFactor < 1) {
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
    targets: Position[] = [];

    addPlayer(following0: PlayerId, following1: PlayerId, x: number, y: number) {
        let player = new Player();
        player.following = [following0, following1];
        this.players.push(player);
        this.positions.push(new Position(x, y));
        this.targets.push(null);
    }

    static calculateTarget(player: Position, a: Position, b: Position): Position {
        let ab = Vector.between(a, b);
        let abMid = ab.multiply(0.5);

        let perpDist = ab.distance() * SIN60;
        let abPerp = ab.perpendicular().normalize().multiply(perpDist);

        let target1 = a.add(abMid).add(abPerp);
        let target2 = a.add(abMid).add(abPerp.multiply(-1));

        return Vector.between(player, target1).distance() <
            Vector.between(player, target2).distance() ?
            target1 :
            target2;
    }

    calculateNewTargets() {
        this.players.forEach((player, playerIndex) => {
            if (player.following[0] != NO_PLAYER &&
                player.following[1] != NO_PLAYER) {
                this.targets[playerIndex] = State.calculateTarget(
                    this.positions[playerIndex],
                    this.positions[player.following[0]],
                    this.positions[player.following[1]]
                );
            }
            else {
                this.targets[playerIndex] = null;
            }
        });
    }

    calculateNewPositions() {
        this.targets.forEach((target, playerIndex) => {
            if (target != null) {
                if (Vector.between(this.positions[playerIndex], target).distance() > 1) {
                    this.positions[playerIndex] =
                        this.positions[playerIndex]
                            .add(Vector.between(this.positions[playerIndex], target).normalize());
                }
            }
        });
    }

    update() {
        this.calculateNewTargets();
        this.calculateNewPositions();
    }

    calculateBoundingBox(): BoundingBox {
        let result: BoundingBox = null;
        this.positions.forEach((position, playerIndex) => {
            if (result == null) {
                result = new BoundingBox(position);
            }
            else {
                result.expand(position);
            }
            let target = this.targets[playerIndex];
            if (target != null) {
                result.expand(target);
            }
        });
        return result;
    }
}

let state_ = new State();

state_.addPlayer(1, 2, 1000, 1000);
state_.addPlayer(0, 3, 2000, 1000);
state_.addPlayer(3, 1, 1000, 2000);
state_.addPlayer(0, 2, 3000, 2000);
// state_.addPlayer(3, 2, 1000, 2000);
// state_.addPlayer(4, 2, 1000, 2000);


const { subscribe, set, update } = writable(new StateDisplay(state_))

export let state = {
    subscribe,
    set,
    updatePositions: () => update(state => state.updatePositions()),
    updateDisplayDimensions: (width: number, height: number) =>
        update(state => state.updateDisplayDimensions(width, height))
};