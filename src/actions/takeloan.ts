import * as bge from "bge-core";

import { Game } from "../game";
import { Card } from "../objects/card";
import { IndustryLocation } from "../objects/industrylocation";
import { ResourceToken } from "../objects/resourcetoken";
import { ScoreTokenKind } from "../objects/scoring";
import { Player } from "../player";
import { City, Industry, Resource } from "../types";

export async function takeLoan(game: Game, player: Player) {

	console.log("Choice to take a loan")

	// TODO: Can you always take loans? Maybe not if income is -10?

	const button = new bge.Button("Take a loan");
	await player.prompt.click(button, {
		return: undefined
	});

	player.money += 30;
	player.decreaseIncome(3);

	const card = await player.prompt.clickAny(player.hand, {
		message: "Discard any card"
	});

	player.discardPile.add(player.hand.remove(card));

	await game.delay.beat();
}