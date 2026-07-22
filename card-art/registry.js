// Central registry for custom card artwork.
// The key must exactly match the card's id in cards.js.

import { archerRig } from "./archer/rig.js";
import { goldMinerRig } from "./gold-miner/rig.js";

export const CARD_ART_RIGS = {
    archer: archerRig,
    gold_miner: goldMinerRig
};
