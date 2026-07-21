// simulation.js
// Pure battle resolution. No Firestore, no DOM. Host calls resolveBattle(game).

import { cards } from "./cards.js";

export const BATTLE_SECONDS = 10;
export const DT = 0.1;
const TILES = 18;          // lane length in tiles; tune game feel here
const T = 1 / TILES;

const PLAYER1_LANE_TOWER_X = 1;
const PLAYER1_KING_TOWER_X = 1.18;

const PLAYER2_LANE_TOWER_X = 0;
const PLAYER2_KING_TOWER_X = -0.18;

const MIN_BATTLE_X = PLAYER2_KING_TOWER_X;
const MAX_BATTLE_X = PLAYER1_KING_TOWER_X;

const KILL_GOLD = { common:1, rare:3, legendary:5 };
const GOLD_CAP = 25;
const PASSIVE_GOLD = 2;

const byId = {};
cards.forEach(c => byId[c.id] = c);

let _uid = 0;
function newId(){ return "t" + Date.now().toString(36) + "_" + (_uid++); }

function spawnTroop(owner, cardId, lane){
    const c = byId[cardId];

    return {
        id:newId(),
        owner,
        cardId,
        lane,

        x:
            owner === "player1"
                ? 0
                : 1,

        hp:c.health,
        maxHp:c.health,

        state:"walk",
        cd:0,

        targetId:null,
        targetEngaged:false
    };
}

function cloneField(bf){
    const out = { lane1:[], lane2:[], lane3:[] };
    ["lane1","lane2","lane3"].forEach(l => out[l] = (bf[l]||[]).map(t => ({...t})));
    return out;
}

function frameSnapshot(field, towers){
    const troops = [];
    ["lane1","lane2","lane3"].forEach(l => {
        field[l].forEach(t => troops.push({
            id:t.id, owner:t.owner, cardId:t.cardId, lane:l,
            x:+t.x.toFixed(4), state:t.state,
            hpRatio:+(t.hp / t.maxHp).toFixed(3)
        }));
    });
    return {
        troops,
        towers: { player1:{...towers.player1}, player2:{...towers.player2} }
    };
}

const LANE_TOWER = { lane1:"left", lane2:"middle", lane3:"right" };
const LANES = [
    "lane1",
    "lane2",
    "lane3"
];

const ADJACENT_LANES = {
    lane1:["lane2"],
    lane2:["lane1", "lane3"],
    lane3:["lane2"]
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
    const sameLaneTarget =
        nearestTargetInLanes(
            field,
            attacker,
            [attacker.lane],
            detectionRange
        );

    /*
        The troop's own lane always has priority.

        Even if an adjacent-lane enemy is closer,
        an available same-lane enemy is selected first.
    */
    if(sameLaneTarget)
        return sameLaneTarget;

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
export function resolveBattle(game, requestedDuration = BATTLE_SECONDS){
    const field = cloneField(game.battlefield);
    const towers = {
        player1:{...game.towers.player1},
        player2:{...game.towers.player2}
    };
    const gold = { player1:game.player1.gold, player2:game.player2.gold };
    const played = { player1:null, player2:null };

    // spawns from locked selections (selectedIndex points into that player's hand)
    ["player1","player2"].forEach(p => {
        const idx = game[p].selectedIndex, lane = game[p].selectedLane;
        if(idx === null || idx === undefined || !lane) return;
        const c = (game[p].hand || [])[idx];
        if(!c || c.type !== "unit" || gold[p] < c.cost) return;
        gold[p] -= c.cost;
        field[lane].push(spawnTroop(p, c.id, lane));
        played[p] = c.id;
    });

    const frames = [];
    let winner = null;
    const steps = Math.max(1, Math.ceil(requestedDuration / DT));

    for(let step=0; step<=steps && !winner; step++){
        frames.push(frameSnapshot(field, towers));
        if(step === steps) break;

        ["lane1","lane2","lane3"].forEach(lane => {
            const troops = field[lane];

            troops.forEach(t => {
                if(t.hp <= 0) return;
                const c = byId[t.cardId];
                const foe = t.owner === "player1" ? "player2" : "player1";
                const fwd = t.owner === "player1" ? 1 : -1;

                const atkR =
    c.range * T;

const detR =
    (c.detectRange || c.range) * T;

t.cd =
    Math.max(
        0,
        t.cd - DT
    );

/*
    First try to recover the troop's existing locked target.

    This works across lanes because it searches the complete
    battlefield rather than only the current lane.
*/
let target =
    findLivingTroop(
        field,
        t.targetId
    );

/*
    The locked target died or no target has been selected yet.
*/
if(!target){
    t.targetId = null;
    t.targetEngaged = false;

    target =
        acquireTarget(
            field,
            t,
            c,
            detR
        );

    if(target)
        t.targetId = target.id;
}

if(target){
    const targetDistance =
        Math.abs(
            target.x -
            t.x
        );

    /*
        Normal troops can attack while inside their range.

        Cards with attackLockedTargetAtAnyRange can continue
        attacking after reaching firing range once, regardless
        of where the target later moves.
    */
    const mayAttack =
        targetDistance <= atkR ||
        (
            c.attackLockedTargetAtAnyRange &&
            t.targetEngaged
        );

    if(mayAttack){
        t.state = "attack";

        /*
            Once this becomes true, the Archer no longer checks
            the target's distance.
        */
        t.targetEngaged = true;

        if(t.cd <= 0){
            damageTroop(
                t,
                target,
                c,
                gold
            );
        }

        return;
    }

    /*
        The target has been selected but has not yet entered
        attack range.

        Follow its forward position without changing lanes.
        No nearer enemy can steal the target.
    */
    t.state = "walk";

    t.x +=
        Math.sign(
            target.x -
            t.x
        ) *
        c.speed *
        T *
        DT;

    t.x =
        Math.max(
            MIN_BATTLE_X,
            Math.min(
                MAX_BATTLE_X,
                t.x
            )
        );

    return;
}

                const laneTower =
    LANE_TOWER[lane];

const towerAlive =
    towers[foe][laneTower] > 0;

const laneTowerGoal =
    t.owner === "player1"
        ? PLAYER1_LANE_TOWER_X
        : PLAYER2_LANE_TOWER_X;

const kingTowerGoal =
    t.owner === "player1"
        ? PLAYER1_KING_TOWER_X
        : PLAYER2_KING_TOWER_X;

const goal =
    towerAlive
        ? laneTowerGoal
        : kingTowerGoal;

const distGoal =
    Math.abs(goal - t.x);

if(distGoal <= atkR){
    t.state = "attack";

    if(t.cd <= 0){
        t.cd = 1 / c.attackSpeed;

        if(towerAlive){
            towers[foe][laneTower] =
                Math.max(
                    0,
                    towers[foe][laneTower] -
                    c.damage
                );
        }
        else{
            towers[foe].king =
                Math.max(
                    0,
                    towers[foe].king -
                    c.damage
                );

            if(towers[foe].king <= 0)
                winner = t.owner;
        }
    }
}
else{
    t.state = "walk";

    t.x +=
        Math.sign(goal - t.x) *
        c.speed *
        T *
        DT;

    t.x = Math.max(
        MIN_BATTLE_X,
        Math.min(MAX_BATTLE_X, t.x)
    );
}
            });

            field[lane] = troops.filter(t => t.hp > 0);
        });
    }
    // The normal loop stops immediately after a King Tower is destroyed.
    // Add one final frame so both clients actually render the destroyed tower.
    if(winner){
        frames.push(frameSnapshot(field, towers));
    }
    ["player1", "player2"].forEach(player => {
    const skipped =
        played[player] === null;

    const goldAward =
        skipped
            ? PASSIVE_GOLD * 2
            : PASSIVE_GOLD;

    gold[player] = Math.min(
        GOLD_CAP,
        gold[player] + goldAward
    );
});

   const actualDuration = Math.max(
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
