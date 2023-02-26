import * as bge from "bge-core";

import { Game } from "../game";
import { LinkLocation } from "../objects/linklocation";
import { LinkTile } from "../objects/linktile";
import { Player } from "../player";

export async function buildLink(game: Game, player: Player) {

	let loc = await player.prompt.clickAny(getBuildableLinks(game, player), { message: "Click on a link!" });

	const card = await player.prompt.clickAny(player.hand, {
		message: "Discard any card"
	});

	loc.tile = player.linkTiles.draw();

	player.discardPile.add(player.hand.remove(card));

	await game.delay.beat();

}


function getBuildableLinks(game: Game, player: Player): LinkLocation[] {
	let buildableLinks: LinkLocation[];

	let builtIndustries = game.board.getBuiltIndustries(player);
	let builtLinks = game.board.getBuiltLinks(player);

	if (builtIndustries.length != 0 || builtLinks.length != 0) {
		buildableLinks = game.board.linkLocations.filter(x => x.tile == null && game.board.isInPlayerNetwork(x, player));
	}
	else {
		buildableLinks = game.board.linkLocations.filter(x => x.tile == null);
	}

	return buildableLinks;
}
