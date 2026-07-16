import { db, auth } from "./firebase.js";
import { getRandomUnitCards, cards } from "./cards.js";
import { resolveBattle, BATTLE_SECONDS, DT } from "./simulation.js";
import {
    renderBoard, drawTopbar, drawHand, setSelectedLane,
    setPhaseTag, setPhaseTime, showResult, hideResult
} from "./render.js";

import {
    doc, onSnapshot, updateDoc, runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

console.log("game.js loaded");

const SELECTION_SECONDS = 5;
const byId = {};
cards.forEach(c => byId[c.id] = c);

let roomId = null;
let latestRoom = null;
let uiSetup = false;

let schedTag = null;      // host: which phase instance we've scheduled
let hostTimer = null;
let replayTag = null;     // client: which battle we're replaying
let replayRaf = null;

function self(){ return auth.currentUser.uid === latestRoom.host ? "player1" : "player2"; }
function isHost(){ return auth.currentUser.uid === latestRoom.host; }
function ref(){ return doc(db, "rooms", roomId); }

export function startGame(id){
    roomId = id;
    onSnapshot(ref(), async (snap) => {
        const room = snap.data();
        if(!room) return;
        latestRoom = room;

        if(room.state !== "playing") return;

        document.getElementById("lobby").classList.add("hidden");
        document.getElementById("game").classList.remove("hidden");
        setupControls();

        if(!room.game){
            if(isHost()) await createGame();
            return;
        }

        render(room);
        if(isHost()) hostSchedule(room.game);
    });
}

/* ---------------- GAME CREATION ---------------- */
async function createGame(){
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref());
        if(snap.data().game) return;
        const now = Date.now();
        tx.update(ref(), { game: {
            phase:"selection", turn:1,
            selectionStartAt: now, matchStartAt: now,
            battle: null,
            player1: { gold:10, hand:getRandomUnitCards(3), selectedCard:null, selectedLane:null },
            player2: { gold:10, hand:getRandomUnitCards(3), selectedCard:null, selectedLane:null },
            battlefield: { lane1:[], lane2:[], lane3:[] },
            towers: {
                player1:{ left:1000, middle:1000, right:1000, king:3000 },
                player2:{ left:1000, middle:1000, right:1000, king:3000 }
            }
        }});
    });
    console.log("Game created");
}

/* ---------------- RENDER ---------------- */
function flatten(bf, forceState){
    const out = [];
    ["lane1","lane2","lane3"].forEach(l =>
        (bf[l]||[]).forEach(t => out.push({
            lane:l, x:t.x, cardId:t.cardId, owner:t.owner,
            state: forceState || t.state
        })));
    return out;
}

function render(room){
    const g = room.game, me = self();
    drawTopbar(g, me);

    if(g.phase === "ended"){
        stopReplay();
        renderBoard(g.towers, flatten(g.battlefield, "idle"), me);
        drawHand(room, me, ()=>{});
        setPhaseTag("Match over");
        showResult(g.winner === me);
        return;
    }
    hideResult();

    if(g.phase === "battle"){
        setPhaseTag("Battle");
        drawHand(room, me, ()=>{});          // next hand, not interactive this phase
        startReplay(g.battle, me);
        return;
    }

    // selection
    stopReplay();
    renderBoard(g.towers, flatten(g.battlefield, "idle"), me);
    drawHand(room, me, (cardId) => writeSelection("selectedCard", cardId));
    setSelectedLane(g[me].selectedLane);
    setPhaseTag("Choose your play");
}

/* ---------------- BATTLE REPLAY (both clients) ---------------- */
function startReplay(battle, me){
    if(!battle || replayTag === battle.startAt) return;
    stopReplay();
    replayTag = battle.startAt;
    const frames = battle.frames, dt = battle.dt || DT, dur = battle.duration || BATTLE_SECONDS;
    const localStart = Date.now();   // replay from receipt, not host clock, to dodge clock skew

    const step = () => {
        if(!latestRoom || !latestRoom.game || latestRoom.game.phase !== "battle"
           || !latestRoom.game.battle || latestRoom.game.battle.startAt !== battle.startAt){
            stopReplay();
            return;
        }
        const elapsed = (Date.now() - localStart) / 1000;
        const idx = Math.max(0, Math.min(frames.length - 1, Math.floor(elapsed / dt)));
        const f = frames[idx];
        renderBoard(f.towers, f.troops.map(t => ({ ...t })), me);
        setPhaseTime(Math.max(0, Math.ceil(dur - elapsed)));
        if(elapsed < dur) replayRaf = requestAnimationFrame(step);
    };
    replayRaf = requestAnimationFrame(step);
}
function stopReplay(){
    if(replayRaf) cancelAnimationFrame(replayRaf);
    replayRaf = null;
    replayTag = null;
}

/* ---------------- HOST CLOCK ---------------- */
function hostSchedule(g){
    const tag = g.phase + ":" + g.turn + ":" + (g.selectionStartAt || g.battle?.startAt || 0);
    if(schedTag === tag) return;
    schedTag = tag;
    clearTimeout(hostTimer);

    if(g.phase === "selection"){
        const fireAt = (g.selectionStartAt || Date.now()) + SELECTION_SECONDS*1000;
        hostTimer = setTimeout(resolvePhase, Math.max(0, fireAt - Date.now()));
    } else if(g.phase === "battle" && g.battle){
        const fireAt = g.battle.startAt + (g.battle.duration || BATTLE_SECONDS)*1000;
        hostTimer = setTimeout(finalizePhase, Math.max(0, fireAt - Date.now()));
    }
}

function topUpHand(hand, playedId){
    if(!playedId) return hand;
    const i = hand.findIndex(c => c.id === playedId);
    const next = hand.slice();
    if(i >= 0){ next.splice(i, 1); next.push(getRandomUnitCards(1)[0]); }
    return next;
}

function towerCountWinner(towers){
    const dead = side => ["left","middle","right","king"].filter(k => towers[side][k] <= 0).length;
    const p1 = dead("player2"), p2 = dead("player1");   // towers each player destroyed
    if(p1 > p2) return "player1";
    if(p2 > p1) return "player2";
    return "draw";
}

async function resolvePhase(){
    const g = latestRoom.game;
    if(!g || g.phase !== "selection" || !isHost()) return;

    const r = resolveBattle(g);

    const hand1 = topUpHand(g.player1.hand, r.played.player1);
    const hand2 = topUpHand(g.player2.hand, r.played.player2);

    const elapsed = (Date.now() - g.matchStartAt) / 1000;
    let endWinner = r.winner;
    if(!endWinner && elapsed >= 180) endWinner = towerCountWinner(r.towers);

    await updateDoc(ref(), {
        "game.phase": "battle",
        "game.battle": { frames:r.frames, startAt:Date.now(), duration:BATTLE_SECONDS, dt:DT, endWinner: endWinner || null },
        "game.battlefield": r.battlefield,
        "game.towers": r.towers,
        "game.player1.gold": r.gold.player1,
        "game.player2.gold": r.gold.player2,
        "game.player1.hand": hand1,
        "game.player2.hand": hand2,
        "game.player1.selectedCard": null,
        "game.player1.selectedLane": null,
        "game.player2.selectedCard": null,
        "game.player2.selectedLane": null
    });
}

async function finalizePhase(){
    const g = latestRoom.game;
    if(!g || g.phase !== "battle" || !isHost()) return;

    const endWinner = g.battle ? g.battle.endWinner : null;
    if(endWinner){
        await updateDoc(ref(), {
            "game.phase":"ended", "game.winner":endWinner, "game.battle":null
        });
    } else {
        await updateDoc(ref(), {
            "game.phase":"selection", "game.turn": g.turn + 1,
            "game.selectionStartAt": Date.now(), "game.battle": null
        });
    }
}

/* ---------------- LOCAL COUNTDOWN ---------------- */
setInterval(() => {
    if(!latestRoom || !latestRoom.game) return;
    const g = latestRoom.game;
    if(g.phase === "selection"){
        const left = SELECTION_SECONDS - (Date.now() - (g.selectionStartAt||Date.now()))/1000;
        setPhaseTime(Math.max(0, Math.ceil(left)));
    }
}, 250);

/* ---------------- INPUT ---------------- */
async function writeSelection(field, value){
    if(!latestRoom || latestRoom.game.phase !== "selection") return;
    await updateDoc(ref(), { [`game.${self()}.${field}`]: value });
}

function setupControls(){
    if(uiSetup) return;
    uiSetup = true;

    document.querySelectorAll(".lane-btn").forEach(b => {
        b.onclick = () => writeSelection("selectedLane", b.dataset.lane);
    });
    const skip = document.getElementById("skipBtn");
    if(skip) skip.onclick = () => writeSelection("selectedCard", null);
}
