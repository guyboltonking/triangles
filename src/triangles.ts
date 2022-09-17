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
}

export let state = new State();

state.addPlayer(1, 2, 10, 10);
state.addPlayer(0, 2, 20, 10);
state.addPlayer(0, 1, 10, 20);
