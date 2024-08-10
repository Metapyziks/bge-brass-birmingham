import * as bge from "bge-core";

import { game } from "../game.js";
import { City, Industry } from "../types.js";

export async function endOfEraScoring() {
    await scoreLinks();
    await scoreIndustries();
}

/***
 * Score all built links, removing them from the board and returning them to each player.
 */
async function scoreLinks() {
    for (let linkLoc of game.board.linkLocations) {
        linkLoc.scoredLinkPoints = linkLoc.data.cities.reduce((s, x) => s + game.board.getLinkPoints(x), 0);
    }

    while (true) {
        const playersWithLinks = game.players
            .filter(x => x.builtLinks.length > 0);

        if (playersWithLinks.length === 0) {
            break;
        }

        // Keep scoring the last-place player

        const player = bge.Helpers.minBy(playersWithLinks, x => x.victoryPoints);

        // Score their most valuable link first

        const link = bge.Helpers.maxBy(player.builtLinks, x => x.location.scoredLinkPoints);
        const linkPoints = link.location.scoredLinkPoints;

        if (linkPoints > 0) {
            bge.message.set("{0} scores {1} points for their {2} between {3}!", player, linkPoints, link, link.location.cities.map(x => City[x]));
            link.beingScored = true;
            await bge.delay.beat();
            
            link.player.increaseVictoryPoints(linkPoints);
            await bge.delay.beat();
            
            link.beingScored = false;
        }

        await link.location.setTile(null);
    }
}

/**
 * Score all built industries.
 */
export async function scoreIndustries() {

    const unscored = new Map(game.players
        .map(x => [x, x.builtIndustries.filter(y => y.hasFlipped)]));

    while (true) {
        const playersWithIndustries = game.players
            .filter(x => unscored.get(x).length > 0);

        if (playersWithIndustries.length === 0) {
            break;
        }

        // Keep scoring the last-place player

        const player = bge.Helpers.minBy(playersWithIndustries, x => x.victoryPoints);
        const playerUnscored = unscored.get(player);

        // Score their most valuable industry first

        const tile = bge.Helpers.maxBy(playerUnscored, x => x.data.saleReward.victoryPoints);
        const victoryPoints = tile.data.saleReward.victoryPoints;

        playerUnscored.splice(playerUnscored.indexOf(tile), 1);

        bge.message.set("{0} scores {1} points for their {2} in {3}!", tile.player, victoryPoints, tile, City[tile.location.city]);

        tile.beingScored = true;
        await bge.delay.beat();
        
        tile.player.increaseVictoryPoints(victoryPoints);
        await bge.delay.beat();
        
        tile.beingScored = false;
    }
}
