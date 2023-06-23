import * as bge from "bge-core";
import { game } from "../game.js";

import { Player } from "../player.js";


@bge.rectangleCard(4.3, 4.3, 0.25, 2.15)
export class PlayerToken extends bge.Card {
    readonly player: Player;

    constructor(player: Player) {
        super();

        this.player = player;

        const url = "https://iili.io/HVo4SkJ.jpg";

        this.front.image = bge.Image.tile(url, 2, 4, 0, player.index);
        this.back.image = bge.Image.tile(url, 2, 4, 1, player.index);

    }
}

export class PlayerTokenSlot extends bge.Zone {
    readonly index: number;
    
    @bge.display()
    get playerToken() {
        return game.turnOrder == null ? null : game.turnOrder[this.index]?.playerToken;
    }

    @bge.display({ position: { x: 4.5, y: -0.5 }, fontScale: 0.5 })
    get moneySpent() { return this.playerToken == null || game.turnOrder.indexOf(this.playerToken.player) > game.turn ? undefined : `£${this.playerToken.player.spent}`; }

    constructor(index: number) {
        super(4, 4);
        
        this.index = index;

        this.outlineStyle = bge.OutlineStyle.NONE;
        this.hideIfEmpty = true;
    }
}
