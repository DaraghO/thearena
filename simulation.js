// simulation.js
// Pure battle resolution. No Firestore, no DOM.
// Host calls resolveBattle(game).

import { cards } from "./cards.js";

export const BATTLE_SECONDS = 10;
export const DT = 0.1;

const TILES = 18;
const T = 1 / TILES;

const PLAYER1_LANE_TOWER_X = 1;
const PLAYER1_KING_TOWER_X = 1.18;

const PLAYER2_LANE_TOWER_X = 0;
const PLAYER2_KING_TOWER_X = -0.18;

const MIN_BATTLE_X = PLAYER2_KING_TOWER_X;
const MAX_BATTLE_X = PLAYER1_KING_TOWER_X;

const BRIDGE_X = 0.5;

const KILL_GOLD = {
    common: 1,
    rare: 3,
    legendary: 5
};

const GOLD_CAP = 100;
const PASSIVE_GOLD = 2;

const byId = {};

cards.forEach(card => {
    byId[card.id] = card;
});

let _uid = 0;

function newId(){
    return (
        "t" +
        Date.now().toString(36) +
        "_" +
        (_uid++)
    );
}

function spawnTroop(owner, cardId, lane){
    const card = byId[cardId];

    return {
        id: newId(),
        owner,
        cardId,
        lane,

        x:
            owner === "player1"
                ? 0
                : 1,

        hp: card.health,
        maxHp: card.health,

        state: "walk",
        cd: 0,

        targetId: null,
        targetEngaged: false,

        mineTimer: 0
    };
}

function cloneField(battlefield){
    const output = {
        lane1: [],
        lane2: [],
        lane3: []
    };

    ["lane1", "lane2", "lane3"].forEach(lane => {
        output[lane] =
            (battlefield[lane] || []).map(troop => ({
                ...troop
            }));
    });

    return output;
}

function frameSnapshot(field, towers){
    const troops = [];

    ["lane1", "lane2", "lane3"].forEach(lane => {
        field[lane].forEach(troop => {
            troops.push({
                id: troop.id,
                owner: troop.owner,
                cardId: troop.cardId,
                lane,

                x: +troop.x.toFixed(4),
                state: troop.state,

                hpRatio:
                    +(troop.hp / troop.maxHp).toFixed(3)
            });
        });
    });

    return {
        troops,

        towers: {
            player1: {
                ...towers.player1
            },

            player2: {
                ...towers.player2
            }
        }
    };
}

const LANE_TOWER = {
    lane1: "left",
    lane2: "middle",
    lane3: "right"
};

const LANES = [
    "lane1",
    "lane2",
    "lane3"
];

const ADJACENT_LANES = {
    lane1: ["lane2"],
    lane2: ["lane1", "lane3"],
    lane3: ["lane2"]
};

function findLivingTroop(field, id){
    if(!id)
        return null;

    for(const lane of LANES){
        const troop =
            field[lane].find(candidate =>
                candidate.id === id &&
                candidate.hp > 0
            );

        if(troop)
            return troop;
    }

    return null;
}

function nearestTargetInLanes(
    field,
    attacker,
    lanes,
    maximumDistance
){
    let target = null;
    let bestDistance = Infinity;

    lanes.forEach(lane => {
        field[lane].forEach(candidate => {
            if(
                candidate.owner === attacker.owner ||
                candidate.hp <= 0
            ){
                return;
            }

            const distance =
                Math.abs(
                    candidate.x -
                    attacker.x
                );

            if(
                distance <= maximumDistance &&
                distance < bestDistance
            ){
                target = candidate;
                bestDistance = distance;
            }
        });
    });

    return target;
}

function acquireTarget(
    field,
    attacker,
    card,
    detectionRange
){
    /*
        Always search the troop's own lane first.
    */
    const sameLaneTarget =
        nearestTargetInLanes(
            field,
            attacker,
            [attacker.lane],
            detectionRange
        );

    if(sameLaneTarget)
        return sameLaneTarget;

    /*
        Only cards such as the Archer may search
        neighbouring lanes.
    */
    if(!card.adjacentLaneTargeting)
        return null;

    return nearestTargetInLanes(
        field,
        attacker,
        ADJACENT_LANES[attacker.lane] || [],
        detectionRange
    );
}

function damageTroop(
    attacker,
    target,
    card,
    gold
){
    target.hp -= card.damage;

    attacker.cd =
        1 / card.attackSpeed;

    if(target.hp > 0)
        return;

    const targetCard =
        byId[target.cardId];

    const killReward =
        targetCard
            ? KILL_GOLD[targetCard.rarity] || 0
            : 0;

    gold[attacker.owner] =
        Math.min(
            GOLD_CAP,
            gold[attacker.owner] +
            killReward
        );

    attacker.targetId = null;
    attacker.targetEngaged = false;
}

function updateGoldMiner(
    troop,
    card,
    gold
){
    const distanceToBridge =
        BRIDGE_X - troop.x;

    const movementPerStep =
        card.speed *
        T *
        DT;

    /*
        Move toward the exact middle of the map.
    */
    if(
        Math.abs(distanceToBridge) >
        movementPerStep
    ){
        troop.state = "walk";

        troop.x +=
            Math.sign(distanceToBridge) *
            movementPerStep;

        troop.x =
            Math.max(
                MIN_BATTLE_X,
                Math.min(
                    MAX_BATTLE_X,
                    troop.x
                )
            );

        return;
    }

    /*
        The Miner has reached the bridge.
    */
    troop.x = BRIDGE_X;
    troop.state = "mine";

    const goldPerSecond =
        card.goldPerSecond || 0;

    if(goldPerSecond <= 0)
        return;

    const secondsPerGold =
        1 / goldPerSecond;

    troop.mineTimer =
        (troop.mineTimer || 0) +
        DT;

    /*
        At two gold per second this awards one gold
        every half-second.
    */
    while(
        troop.mineTimer + 0.000001 >=
        secondsPerGold
    ){
        troop.mineTimer -=
            secondsPerGold;

        gold[troop.owner] =
            Math.min(
                GOLD_CAP,
                gold[troop.owner] + 1
            );
    }
}

export function resolveBattle(
    game,
    requestedDuration = BATTLE_SECONDS
){
    const field =
        cloneField(game.battlefield);

    const towers = {
        player1: {
            ...game.towers.player1
        },

        player2: {
            ...game.towers.player2
        }
    };

    const gold = {
        player1: game.player1.gold,
        player2: game.player2.gold
    };

    const played = {
        player1: null,
        player2: null
    };

    /*
        Spawn the cards selected during the Rest Phase.
    */
    ["player1", "player2"].forEach(player => {
        const selectedIndex =
            game[player].selectedIndex;

        const lane =
            game[player].selectedLane;

        if(
            selectedIndex === null ||
            selectedIndex === undefined ||
            !lane
        ){
            return;
        }

        const card =
            (game[player].hand || [])
                [selectedIndex];

        if(
            !card ||
            card.type !== "unit" ||
            gold[player] < card.cost
        ){
            return;
        }

        gold[player] -= card.cost;

        field[lane].push(
            spawnTroop(
                player,
                card.id,
                lane
            )
        );

        played[player] = card.id;
    });

    const frames = [];
    let winner = null;

    const steps =
        Math.max(
            1,
            Math.ceil(
                requestedDuration / DT
            )
        );

    for(
        let step = 0;
        step <= steps && !winner;
        step++
    ){
        frames.push(
            frameSnapshot(
                field,
                towers
            )
        );

        if(step === steps)
            break;

        LANES.forEach(lane => {
            const troops =
                field[lane];

            troops.forEach(troop => {
                if(troop.hp <= 0)
                    return;

                const card =
                    byId[troop.cardId];

                if(!card)
                    return;

                const foe =
                    troop.owner === "player1"
                        ? "player2"
                        : "player1";

                /*
                    Gold Miner has its own behaviour.

                    It does not acquire targets, attack troops
                    or damage towers.
                */
                if(card.behaviour === "goldMiner"){
                    updateGoldMiner(
                        troop,
                        card,
                        gold
                    );

                    return;
                }

                const attackRange =
                    card.range * T;

                const detectionRange =
                    (
                        card.detectRange ||
                        card.range
                    ) * T;

                troop.cd =
                    Math.max(
                        0,
                        troop.cd - DT
                    );

                /*
                    Recover the troop's existing locked target.
                */
                let target =
                    findLivingTroop(
                        field,
                        troop.targetId
                    );

                /*
                    The target died, or no target has been
                    selected yet.
                */
                if(!target){
                    troop.targetId = null;
                    troop.targetEngaged = false;

                    target =
                        acquireTarget(
                            field,
                            troop,
                            card,
                            detectionRange
                        );

                    if(target)
                        troop.targetId = target.id;
                }

                if(target){
                    const targetDistance =
                        Math.abs(
                            target.x -
                            troop.x
                        );

                    const mayAttack =
                        targetDistance <= attackRange ||
                        (
                            card.attackLockedTargetAtAnyRange &&
                            troop.targetEngaged
                        );

                    if(mayAttack){
                        troop.state = "attack";
                        troop.targetEngaged = true;

                        if(troop.cd <= 0){
                            damageTroop(
                                troop,
                                target,
                                card,
                                gold
                            );
                        }

                        return;
                    }

                    /*
                        Follow the locked target's horizontal
                        position without changing lanes.
                    */
                    troop.state = "walk";

                    troop.x +=
                        Math.sign(
                            target.x -
                            troop.x
                        ) *
                        card.speed *
                        T *
                        DT;

                    troop.x =
                        Math.max(
                            MIN_BATTLE_X,
                            Math.min(
                                MAX_BATTLE_X,
                                troop.x
                            )
                        );

                    return;
                }

                /*
                    There is no troop target, so continue
                    toward the relevant enemy tower.
                */
                const laneTower =
                    LANE_TOWER[lane];

                const towerAlive =
                    towers[foe][laneTower] > 0;

                const laneTowerGoal =
                    troop.owner === "player1"
                        ? PLAYER1_LANE_TOWER_X
                        : PLAYER2_LANE_TOWER_X;

                const kingTowerGoal =
                    troop.owner === "player1"
                        ? PLAYER1_KING_TOWER_X
                        : PLAYER2_KING_TOWER_X;

                const goal =
                    towerAlive
                        ? laneTowerGoal
                        : kingTowerGoal;

                const distanceToGoal =
                    Math.abs(
                        goal -
                        troop.x
                    );

                if(distanceToGoal <= attackRange){
                    troop.state = "attack";

                    if(troop.cd <= 0){
                        troop.cd =
                            1 / card.attackSpeed;

                        if(towerAlive){
                            towers[foe][laneTower] =
                                Math.max(
                                    0,
                                    towers[foe][laneTower] -
                                    card.damage
                                );
                        }
                        else{
                            towers[foe].king =
                                Math.max(
                                    0,
                                    towers[foe].king -
                                    card.damage
                                );

                            if(towers[foe].king <= 0){
                                winner =
                                    troop.owner;
                            }
                        }
                    }
                }
                else{
                    troop.state = "walk";

                    troop.x +=
                        Math.sign(
                            goal -
                            troop.x
                        ) *
                        card.speed *
                        T *
                        DT;

                    troop.x =
                        Math.max(
                            MIN_BATTLE_X,
                            Math.min(
                                MAX_BATTLE_X,
                                troop.x
                            )
                        );
                }
            });

            field[lane] =
                troops.filter(troop =>
                    troop.hp > 0
                );
        });
    }

    /*
        Add one final frame after the King Tower dies
        so clients can render the destruction.
    */
    if(winner){
        frames.push(
            frameSnapshot(
                field,
                towers
            )
        );
    }

    /*
        Normal end-of-turn passive gold.
    */
    ["player1", "player2"].forEach(player => {
        const skipped =
            played[player] === null;

        const goldAward =
            skipped
                ? PASSIVE_GOLD * 2
                : PASSIVE_GOLD;

        gold[player] =
            Math.min(
                GOLD_CAP,
                gold[player] +
                goldAward
            );
    });

    const actualDuration =
        Math.max(
            DT,
            (frames.length - 1) * DT
        );

    return {
        frames,
        battlefield: field,
        towers,
        gold,
        played,
        winner,
        duration: actualDuration
    };
}
