import * as bge from "bge-core";

import { game } from "../game.js";
import { Card, CityCard, IndustryCard } from "../objects/card.js";
import { LinkTile } from "../objects/linktile.js";
import { MerchantTile } from "../objects/merchanttile.js";
import { PlayerToken } from "../objects/playertoken.js";
import { ResourceToken } from "../objects/resourcetoken.js";
import { ScoreTokenKind } from "../objects/scoring.js";
import { ALL_INDUSTRIES, City, Resource } from "../types.js";

export async function setup() {
    for (let player of game.players) {
        player.victoryPointToken = game.scoreTrack.createScoreToken(player, ScoreTokenKind.VICTORY_POINTS);
        player.incomeToken = game.scoreTrack.createScoreToken(player, ScoreTokenKind.INCOME);

        player.playerToken = new PlayerToken(player);

        for (let i = 0; i < 15; ++i) {
            player.linkTiles.add(new LinkTile(player));
        }
    }

    // Merchants
    const merchantTiles = [...MerchantTile.generateDeck(game.players.length)];

    bge.random.shuffle(merchantTiles);

    for (let merchantLocation of game.board.merchantLocations) {
        if (merchantLocation.data.minPlayers > game.players.length) {
            continue;
        }

        merchantLocation.tile = merchantTiles.pop();

        if (merchantLocation.tile.industries.length > 0) {
            merchantLocation.marketBeer = new ResourceToken(Resource.Beer);
        }
    }

    game.drawPile.addRange(Card.generateDeck(game.players.length));
    game.drawPile.shuffle();

    for (let i = 0; i < game.players.length; ++i) {
        game.wildIndustryPile.add(new IndustryCard(ALL_INDUSTRIES, 2));
        game.wildLocationPile.add(new CityCard(City.Any, 1));
    }

    bge.message.set("{0} is choosing a game length", game.players[0]);

    game.tutorialGame = await bge.anyExclusive(() => [
        game.players[0].prompt.click("Introductory Game", { return: true }),
        game.players[0].prompt.click("Full Game", { return: false })
    ]);

    game.revealEverythingToSpectators = game.tutorialGame;

    bge.message.set("{0} has chosen {1}", game.players[0], game.tutorialGame ? "Introductory Game" : "Full Game");

    await bge.delay.short();

    // Deal cards etc

    game.drawPile.deal(game.players.map(x => x.discardPile));
    game.drawPile.deal(game.players.map(x => x.hand), 8);

    await bge.delay.beat();
}
