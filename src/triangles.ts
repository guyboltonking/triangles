import { writable } from "svelte/store";

type PlayerId = number;

class Player {
    following: [PlayerId, PlayerId];

    constructor(following: [PlayerId, PlayerId]) {
        this.following = following;
    }
}

export class Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class ViewBox {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(boundingBox: BoundingBox) {
        this.x = boundingBox.origin().x;
        this.y = boundingBox.origin().y;
        this.width = boundingBox.width();
        this.height = boundingBox.height();
    }
}

export class BoundingBox {
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

    origin(): Position {
        return this.topLeft;
    }

    width(): number {
        return this.bottomRight.x - this.topLeft.x;
    }

    height(): number {
        return this.bottomRight.y - this.topLeft.y;
    }
}

class PlayerDisplay {
    following: [PlayerDisplay, PlayerDisplay] = [null, null];
    position: Position = new Position(0, 0);
}

class StateDisplay {
    width: number = 0;
    height: number = 0;
    margin: number = 10;
    viewBox: ViewBox = new ViewBox(new BoundingBox(new Position(0, 0)));
    state: State;
    playerDisplays: PlayerDisplay[];

    constructor(state: State) {
        this.state = state;
        this.updatePlayerDisplays();
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
            }
        }

        this.state.positions.forEach((position, i) => {
            let playerDisplay = this.playerDisplays[i];
            playerDisplay.position = position;
            this.state.players[i].following.forEach((playerId, j) => {
                playerDisplay.following[j] = playerId == -1 ?
                    null :
                    this.playerDisplays[playerId];
            });
        });
    }

    private calculateViewBox(): ViewBox {
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
            this.height / boundingBox.height(),
            this.width / boundingBox.width());

        if (viewToDisplayScalingFactor < 1) {
            requiredWidth = this.width / viewToDisplayScalingFactor;
            requiredHeight = this.height / viewToDisplayScalingFactor;
        }

        boundingBox.topLeft.x -= (requiredWidth - boundingBox.width()) / 2;
        boundingBox.bottomRight.x += (requiredWidth - boundingBox.width())
        boundingBox.topLeft.y -= (requiredHeight - boundingBox.height()) / 2;
        boundingBox.bottomRight.y += (requiredHeight - boundingBox.height())

        let viewBox = new ViewBox(boundingBox);

        return viewBox;
    }
}

class State {
    players: Player[] = [];
    positions: Position[] = [];

    addPlayer(following0: PlayerId, following1: PlayerId, x: number, y: number) {
        this.players.push(new Player([following0, following1]));
        this.positions.push(new Position(x, y));
    }

    update() {
        let inc = 1;
        for (let position of this.positions) {
            // let dx = inc;
            // let dy = inc;
            let dx = (Math.random() - 0.5) * 2;
            let dy = (Math.random() - 0.5) * 2;
            //inc = -inc;
            position.x += dx;
            position.y += dy;
        }
    }

    calculateBoundingBox(): BoundingBox {
        let result: BoundingBox = null;
        for (let position of this.positions) {
            if (result == null) {
                result = new BoundingBox(position);
            }
            else {
                result.expand(position);
            }
        }
        return result;
    }
}

let state_ = new State();

state_.addPlayer(1, 2, 10, 10);
state_.addPlayer(0, 2, 20, 10);
state_.addPlayer(0, 1, 10, 20);

const { subscribe, set, update } = writable(new StateDisplay(state_))

export let state = {
    subscribe,
    set,
    updatePositions: () => update(state => state.updatePositions()),
    updateDisplayDimensions: (width: number, height: number) =>
        update(state => state.updateDisplayDimensions(width, height))
};