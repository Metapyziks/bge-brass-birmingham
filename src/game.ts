import * as bge from "bge-core";

import { Player } from "./player.js";
import { GameBoard } from "./objects/gameboard.js";
import { ResourceMarket } from "./objects/resourcemarket.js";
import { Resource, Era } from "./types.js";

import {
    grantIncome,
    playerAction,
    PlayerActionResult,
    reorderPlayers,
    resetSpentMoney,
    startRailEra
} from "./actions/index.js";

import { Card } from "./objects/card.js";
import { ScoreTrack } from "./objects/scoring.js";
import { IGameState } from "./state.js";
import { setup } from "./actions/setup.js";
import { endOfEraScoring } from "./actions/scoring.js";

/**
 * @summary This class contains the meat of your game.
 * @details In this example game, players take turns discarding cards, and then either drawing from a Deck or a Hand.
 */
export class Game extends bge.Game<Player> {

    era: Era = Era.Canal;
    
    firstRound = true;
    turnOrder?: Player[];
    turn = 0;
    action = 0;

    @bge.display()
    readonly board = new GameBoard();

    @bge.display()
    readonly playerZones: bge.Zone[] = [];

    readonly drawPile = new bge.Deck(Card, { orientation: bge.CardOrientation.FACE_DOWN });
    readonly wildLocationPile = new bge.Deck(Card, { orientation: bge.CardOrientation.FACE_UP });
    readonly wildIndustryPile = new bge.Deck(Card, { orientation: bge.CardOrientation.FACE_UP });

    readonly coalMarket: ResourceMarket;
    readonly ironMarket: ResourceMarket;

    readonly scoreTrack: ScoreTrack;

    turnStartState?: IGameState;
    actionStartState?: IGameState;

    get currentPlayer(): Player {
        return this.turnOrder[this.turn];
    }

    get actionsPerTurn(): number {
        return this.firstRound ? 1 : 2;
    }

    /**
     * Game runners expect games to have a public parameterless constructor, like this.
     */
    constructor() {
        // We need to tell Game<TPlayer> how to construct a player here.
        super(Player);

        this.coalMarket = new ResourceMarket(this.board, Resource.Coal);
        this.ironMarket = new ResourceMarket(this.board, Resource.Iron);

        this.scoreTrack = new ScoreTrack();

        game = this;
    }

    protected override onInitialize(): void {
        this.playerZones.push(...this.players.map(x => x.zone));

        const playerZonesOptions = this.children.getOptions("playerZones");

        if (this.players.length === 2) {
            playerZonesOptions.position = { y: -46 };
            playerZonesOptions.arrangement = new bge.LinearArrangement({
                axis: "x"
            });
        } else {
            playerZonesOptions.arrangement = new bge.RectangularArrangement({
                size: new bge.Vector3(60, 60)
            });
        }
    }

    protected override async onRun(): Promise<bge.IGameResult> {
        await this.setup();
        await this.runEra();
        await this.railEraStart();
        await this.runEra();

        return await this.endGame();
    }

    private async runEra(): Promise<void> {
        while (this.players.every(x => x.hand.count > 0)) {
            await this.roundStart();

            while (this.turn < this.turnOrder.length) {
                await this.playerTurnStart();

                while (this.action < this.actionsPerTurn) {
                    await this.playerAction();
                    this.cancelAllPromises();
                }

                await this.playerTurnEnd();
            }

            await this.roundEnd();
        }

        await this.eraEnd();
    }

    async setup(): Promise<void> {
        await setup();
        
        this.firstRound = true;
        this.turnOrder = [...this.players];

        bge.random.shuffle(this.turnOrder);
    }

    async roundStart(): Promise<void> {
        this.turn = 0;
        
        if (!this.firstRound) {
            await grantIncome(this.turnOrder);
        }
    }

    async playerTurnStart(): Promise<void> {
        this.action = 0;
        
        this.turnStartState = this.serialize();
    }

    async playerAction(): Promise<void> {
        this.actionStartState = this.serialize();

        const result = await playerAction(this.currentPlayer);

        switch (result) {
            case PlayerActionResult.RESOLVED:
                break;

            case PlayerActionResult.RESTART_ACTION:
                this.deserialize(this.actionStartState);
                return;

            case PlayerActionResult.RESTART_TURN:
                this.deserialize(this.turnStartState);
                return;
        }

        this.action++;
    }

    async playerTurnEnd(): Promise<void> {
        this.drawPile.dealTotal([this.currentPlayer.hand], 2, 8);

        this.turn++;
    }

    async roundEnd(): Promise<void> {
        this.firstRound = false;
        
        await reorderPlayers();
        await resetSpentMoney();

        if (this.players.every(x => x.hand.count > 0)) {
            return;
        }

        await this.eraEnd();
    }

    async eraEnd(): Promise<void> {
        await endOfEraScoring();
    }

    async railEraStart(): Promise<void> {
        await startRailEra();
    }

    async endGame(): Promise<bge.IGameResult> {
        return {
            scores: this.players.map(x => x.victoryPoints)
        };
    }

    serialize(): IGameState {
        return {
            era: this.era,
            turnOrder: this.turnOrder?.map(x => x.index),
            turn: this.turn,
            action: this.action,

            board: this.board.serialize(),
            players: this.players.map(x => x.serialize())
        } as any;
    }

    deserialize(state: IGameState): void {
        this.era = state.era;
        this.turnOrder = state.turnOrder?.map(x => this.players[x]);
        this.turn = state.turn;
        this.action = state.action;

        this.board.deserialize(state.board);
        this.players.forEach((x, i) => {
            x.deserialize(state.players[i]);
            x.updateBuiltTiles();
        });
    }
}

export let game: Game;