import * as bge from "bge-core";

import INDUSTRIES from "../data/industrylevels.js"

import { Player } from "../player.js";
import { IIndustryLevelData, Industry } from "../types.js";
import { IndustryLocation } from "./industrylocation.js";
import { ResourceToken } from "./resourcetoken.js";

@bge.rectangleCard(2.25, 2.25, 0.15, 0.1)
export class IndustryTile extends bge.Card {
    readonly player: Player;
    readonly industry: Industry;
    readonly data: IIndustryLevelData;

    @bge.display({
        arrangement: new bge.PileArrangement({
            itemWidth: 0.8,
            minQuantityForPyramid: 1,
            localBounds: new bge.Bounds(new bge.Vector3(3, 3, 0))
        })
    })
    readonly resources: ResourceToken[] = [];

    location?: IndustryLocation;
    hasFlipped: boolean = false;
    beingScored: boolean = false;

    constructor(player: Player, industry: Industry, level: number) {
        super();

        this.player = player;
        this.industry = industry;
        this.data = INDUSTRIES.get(industry)[level - 1];

        this.name = `${player.name} ${Industry[industry]} ${level}`;

        const frontUrl = player.index < 2
            ? "https://iili.io/HMC2BJs.jpg"
            : "https://iili.io/HMC2C5G.jpg";

        const backUrl = player.index < 2
            ? "https://iili.io/HWYOKtp.jpg"
            : "https://iili.io/HWYOFNR.jpg";

        const indexOffset = (player.index % 2) * 31;
        const index = indexOffset + this.data.tileIndex;

        const row = 6 - Math.floor(index / 9);
        const col = index % 9;

        this.front.image = bge.Image.tile(frontUrl, 7, 9, row, col);
        this.back.image = bge.Image.tile(backUrl, 7, 9, row, col);
    }

    clearResources() {
        this.resources.splice(0, this.resources.length);
    }

    async consumeResource(destination?: ResourceToken[]) {
        if (this.resources.length === 0) {
            throw new Error("This tile has no resources to consume");
        }

        const resource = this.resources.pop();
        destination?.push(resource);

        await bge.delay.beat();

        if (this.resources.length === 0) {
            await this.flip();
        }
    }

    async flip() {
        if (this.hasFlipped) {
            throw new Error("This tile has already flipped");
        }

        this.hasFlipped = true;

        await bge.delay.beat();

        if (this.data.saleReward.income > 0) {
            this.player.increaseIncome(this.data.saleReward.income);
            await bge.delay.beat();
        }
    }
}
