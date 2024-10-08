import * as bge from "bge-core";

import { game } from "../game.js";
import { Player } from "../player.js";

export async function takeLoan(player: Player) {

	// TODO: Can you always take loans? Maybe not if income is -10?
	
	await player.prompt.click(new bge.Button("Take a loan"));

	bge.message.add("{0} is taking a loan", player);

	player.money += 30;
	player.decreaseIncome(3);

	await player.discardAnyCard();
}
