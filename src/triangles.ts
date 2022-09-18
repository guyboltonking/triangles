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
        this.x = boundingBox.topLeft.x;
        this.y = boundingBox.topLeft.y;
        this.width = boundingBox.bottomRight.x - boundingBox.topLeft.x;
        this.height = boundingBox.bottomRight.y - boundingBox.topLeft.y;
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

class State {
    players: Player[] = [];
    positions0: Position[] = [];
    positions1: Position[] = [];

    addPlayer(following0: PlayerId, following1: PlayerId, x: number, y: number) {
        this.players.push(new Player([following0, following1]));
        this.positions0.push(new Position(x, y));
    }

    update() {
        for (let position of this.positions0) {
            let dx = Math.floor(Math.random() * 3.5) - 1;
            let dy = Math.floor(Math.random() * 2.8) - 1;
            position.x += dx;
            position.y += dy;
        }

    }

    positions(): Position[] {
        this.update();
        return this.positions0;
    }

    boundingBox(): BoundingBox {
        let result: BoundingBox = null;
        for (let position of this.positions()) {
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

export let state = new State();

state.addPlayer(1, 2, 10, 10);
state.addPlayer(0, 2, 20, 10);
state.addPlayer(0, 1, 10, 20);
