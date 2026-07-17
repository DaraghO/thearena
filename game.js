import { db, auth } from "./firebase.js";
import { getRandomUnitCards, cards } from "./cards.js";
import { resolveBattle, BATTLE_SECONDS, DT } from "./simulation.js";
import {
    renderBoard, initBattle, drawBattleFrame, resetBattle,
    drawTopbar, drawHand, setSelectedLane,
    setPhaseTag, setPhaseTime, setMatchTime,
    setTrayLocked, showBanner,
    showResult, hideResult,
    setReturnLobbyHandler, showPlayerLeft, hidePlayerLeft
} from "./render.js";

import {
    doc, onSnapshot, updateDoc, runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

console.log("game.js loaded");

const SELECTION_SECONDS = 5;
const HEARTBEAT_INTERVAL_MS = 4000;
const PLAYER_STALE_MS = 14000;
const PRESENCE_CHECK_INTERVAL_MS = 2000;

let roomId = null;
let latestRoom = null;
let uiSetup = false;

let schedTag = null;
let hostTimer = null;
let replayTag = null;
let replayRaf = null;
let lastPhase = null;
let heartbeatTimer = null;
let presenceCheckTimer = null;
let disconnectResolutionRunning = false;


function playerKeyFor(room)
{
    return auth.currentUser.uid === room.host
        ? "player1"
        : "player2";
}

function opponentKeyFor(room)
{
    return playerKeyFor(room) === "player1"
        ? "player2"
        : "player1";
}

function self()
{
    return playerKeyFor(latestRoom);
}

function isHost()
{
    return auth.currentUser.uid === latestRoom.host;
}

function ref()
{
    return doc(db, "rooms", roomId);
}

export function startGame(id){
    roomId = id;
   onSnapshot(ref(), async (snap) => {

    if(!snap.exists()){
        stopPresenceTracking();
        return;
    }

    const room = snap.data();
    latestRoom = room;

    startPresenceTracking();

    if(room.state === "player-left"){
    const leavingUid = room.leftBy;

    if(leavingUid !== auth.currentUser.uid){
        showPlayerLeft(returnToLobby);
    }

    return;
}

if(room.state !== "playing")
    return;

hidePlayerLeft();

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

/* ---- new game on restart ---- */ 
function newGameState(){
    const now = Date.now();

    return {
        phase: "selection",
        turn: 1,

        selectionStartAt: now,
        matchStartAt: now,

        battle: null,
        winner: null,

        rematch: {
            player1: false,
            player2: false
        },

        player1: {
            gold: 10,
            hand: getRandomUnitCards(3),
            selectedIndex: null,
            selectedLane: null
        },

        player2: {
            gold: 10,
            hand: getRandomUnitCards(3),
            selectedIndex: null,
            selectedLane: null
        },

        battlefield: {
            lane1: [],
            lane2: [],
            lane3: []
        },

        towers: {
            player1: {
                left: 1000,
                middle: 1000,
                right: 1000,
                king: 3000
            },

            player2: {
                left: 1000,
                middle: 1000,
                right: 1000,
                king: 3000
            }
        }
    };
}
/* ---------------- PRESENCE ---------------- */

function startPresenceTracking()
{
    if(!heartbeatTimer)
    {
        sendHeartbeat();

        heartbeatTimer = setInterval(
            sendHeartbeat,
            HEARTBEAT_INTERVAL_MS
        );
    }

    if(!presenceCheckTimer)
    {
        presenceCheckTimer = setInterval(
            checkOpponentPresence,
            PRESENCE_CHECK_INTERVAL_MS
        );
    }
}


function stopPresenceTracking()
{
    if(heartbeatTimer)
        clearInterval(heartbeatTimer);

    if(presenceCheckTimer)
        clearInterval(presenceCheckTimer);

    heartbeatTimer = null;
    presenceCheckTimer = null;
}


async function sendHeartbeat()
{
    if(!roomId || !latestRoom)
        return;

    const playerKey =
        playerKeyFor(latestRoom);

    // Player 2 may call startGame before the join write finishes.
    if(
        playerKey === "player2" &&
        latestRoom.player2 !== auth.currentUser.uid
    ){
        return;
    }

    try
    {
        await updateDoc(ref(), {
            [`presence.${playerKey}`]: Date.now()
        });
    }
    catch(error)
    {
        // Expected if the room was just deleted.
        console.warn(
            "Heartbeat stopped:",
            error
        );
    }
}


async function checkOpponentPresence()
{
    if(!latestRoom)
        return;

    if(latestRoom.state !== "playing")
        return;

    if(!latestRoom.game)
        return;

    if(latestRoom.game.phase === "ended")
        return;

    const opponent =
        opponentKeyFor(latestRoom);

    const opponentLastSeen =
        latestRoom.presence?.[opponent];

    if(!opponentLastSeen)
        return;

    if(
        Date.now() - opponentLastSeen
        <= PLAYER_STALE_MS
    ){
        return;
    }

    await resolveDisconnectedPlayer();
}


async function resolveDisconnectedPlayer()
{
    if(disconnectResolutionRunning)
        return;

    disconnectResolutionRunning = true;

    try
    {
        await runTransaction(db, async transaction => {

            const snapshot =
                await transaction.get(ref());

            if(!snapshot.exists())
                return;

            const room = snapshot.data();

            if(room.state !== "playing")
                return;

            if(!room.game)
                return;

            if(room.game.phase === "ended")
                return;

            const winner =
                playerKeyFor(room);

            const disconnectedPlayer =
                winner === "player1"
                    ? "player2"
                    : "player1";

            const lastSeen =
                room.presence?.[disconnectedPlayer];

            // Recheck inside the transaction in case a heartbeat
            // arrived while this operation was starting.
            if(!lastSeen)
                return;

            if(
                Date.now() - lastSeen
                <= PLAYER_STALE_MS
            ){
                return;
            }

            transaction.update(ref(), {
                "game.phase": "ended",
                "game.winner": winner,
                "game.battle": null,
                "game.endReason": "disconnect",
                "game.disconnectedPlayer":
                    disconnectedPlayer
            });
        });
    }
    catch(error)
    {
        console.error(
            "Could not resolve disconnect:",
            error
        );
    }
    finally
    {
        disconnectResolutionRunning = false;
    }
}

/* ---------------- GAME CREATION ---------------- */
async function createGame(){
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref());
        const room = snap.data();

        if(room.game)
            return;

        tx.update(ref(), {
            game: newGameState()
        });
    });

    console.log("Game created");
}

/* ---------------- RENDER ---------------- */
function flatten(bf, forceState){
    const out = [];
    ["lane1","lane2","lane3"].forEach(l =>
        (bf[l]||[]).forEach(t => out.push({
            lane:l, x:t.x, cardId:t.cardId, owner:t.owner,
            state: forceState || t.state,
            hpRatio: t.maxHp ? t.hp / t.maxHp : 1
        })));
    return out;
}

function render(room){
    const g = room.game, me = self();
    drawTopbar(g, me);

    if(g.phase !== lastPhase){
        if(g.phase === "selection") showBanner("Rest Phase!", "rest");
        else if(g.phase === "battle") showBanner("Battle Phase!", "battle");
        lastPhase = g.phase;
    }

    if(g.phase === "ended"){
    stopReplay();
    setTrayLocked(true);

    renderBoard(
        g.towers,
        flatten(g.battlefield, "idle"),
        me
    );

    drawHand(room, me, ()=>{});
    setPhaseTag("Match over", "over");

    const opponent =
        me === "player1" ? "player2" : "player1";

    let outcome = "lose";

    if(g.winner === "draw")
        outcome = "draw";
    else if(g.winner === me)
        outcome = "win";

    const rematch = g.rematch || {
        player1: false,
        player2: false
    };

    showResult(
        outcome,
        rematch[me] === true,
        rematch[opponent] === true,
        requestRematch
    );

    if(
        isHost() &&
        rematch.player1 === true &&
        rematch.player2 === true
    ){
        restartMatch();
    }

    return;
}
    hideResult();

    if(g.phase === "battle"){
        setTrayLocked(true);
        setPhaseTag("Battle Phase", "battle");
        drawHand(room, me, ()=>{});
        startReplay(g.battle, me);
        return;
    }

    // selection
    stopReplay();
    setTrayLocked(false);
    renderBoard(g.towers, flatten(g.battlefield, "idle"), me);
    drawHand(room, me, (index) => writeSelection("selectedIndex", index));
    setSelectedLane(g[me].selectedLane);
    setPhaseTag("Rest Phase", "rest");
}

/* ---------------- BATTLE REPLAY (both clients) ---------------- */
function startReplay(battle, me){
    if(!battle || replayTag === battle.startAt) return;
    stopReplay();
    replayTag = battle.startAt;
    const frames = battle.frames, dt = battle.dt || DT, dur = battle.duration || BATTLE_SECONDS;
    const localStart = Date.now();

    initBattle(me);

    const step = () => {
        if(!latestRoom || !latestRoom.game || latestRoom.game.phase !== "battle"
           || !latestRoom.game.battle || latestRoom.game.battle.startAt !== battle.startAt){
            stopReplay();
            return;
        }
        const elapsed = (Date.now() - localStart) / 1000;
        const fpos = elapsed / dt;
        const idx = Math.min(frames.length - 1, Math.floor(fpos));
        const nidx = Math.min(frames.length - 1, idx + 1);
        const tt = Math.max(0, Math.min(1, fpos - idx));

        drawBattleFrame(frames[idx], frames[nidx], tt, me);

        if(elapsed < dur){
            replayRaf = requestAnimationFrame(step);
        } else {
            drawBattleFrame(frames[frames.length - 1], null, 1, me);
        }
    };
    replayRaf = requestAnimationFrame(step);
}
function stopReplay(){
    if(replayRaf) cancelAnimationFrame(replayRaf);
    replayRaf = null;
    replayTag = null;
    resetBattle();
}

/* ---------------- HOST CLOCK ---------------- */
function hostSchedule(g){
    const tag = g.phase + ":" + g.turn + ":" + (g.selectionStartAt || (g.battle && g.battle.startAt) || 0);
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

function towerCountWinner(towers){
    const dead = side => ["left","middle","right","king"].filter(k => towers[side][k] <= 0).length;
    const p1 = dead("player2"), p2 = dead("player1");
    if(p1 > p2) return "player1";
    if(p2 > p1) return "player2";
    return "draw";
}

async function resolvePhase(){
    const g = latestRoom.game;

    if(!g || g.phase !== "selection" || !isHost())
        return;

    const elapsed =
        (Date.now() - g.matchStartAt) / 1000;

    const matchRemaining =
        Math.max(0, 180 - elapsed);

    // The three-minute clock has already expired before this
    // rest phase finished. End immediately instead of creating
    // another ten-second battle.
    if(matchRemaining <= 0){
        await updateDoc(ref(), {
            "game.phase": "ended",
            "game.winner": towerCountWinner(g.towers),
            "game.battle": null
        });

        return;
    }

    // Do not let a battle continue beyond the remaining match time.
    const allowedBattleDuration =
        Math.min(BATTLE_SECONDS, matchRemaining);

    const r =
        resolveBattle(g, allowedBattleDuration);

    let endWinner = r.winner;

    // If this battle reaches the three-minute limit without
    // destroying a King Tower, decide using destroyed towers.
    if(
        !endWinner &&
        allowedBattleDuration >= matchRemaining
    ){
        endWinner = towerCountWinner(r.towers);
    }

    await updateDoc(ref(), {
        "game.phase": "battle",

        "game.battle": {
            frames: r.frames,
            startAt: Date.now(),
            duration: r.duration,
            dt: DT,
            endWinner: endWinner || null
        },

        "game.battlefield": r.battlefield,
        "game.towers": r.towers,

        "game.player1.gold": r.gold.player1,
        "game.player2.gold": r.gold.player2,

        "game.player1.selectedIndex": null,
        "game.player1.selectedLane": null,
        "game.player2.selectedIndex": null,
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
            "game.phase":"selection",
            "game.turn": g.turn + 1,
            "game.selectionStartAt": Date.now(),
            "game.battle": null,
            "game.player1.hand": getRandomUnitCards(3),   // fresh cards each rest phase
            "game.player2.hand": getRandomUnitCards(3)
        });
    }
}

async function requestRematch(){
    if(!latestRoom || !latestRoom.game)
        return;

    if(latestRoom.game.phase !== "ended")
        return;

    await updateDoc(ref(), {
        [`game.rematch.${self()}`]: true
    });
}


async function restartMatch(){
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref());
        const room = snap.data();

        if(!room || !room.game)
            return;

        const rematch = room.game.rematch || {};

        if(room.game.phase !== "ended")
            return;

        if(
            rematch.player1 !== true ||
            rematch.player2 !== true
        ){
            return;
        }

        tx.update(ref(), {
            game: newGameState()
        });
    });
}


/* ---------------- LOCAL COUNTDOWNS ---------------- */
setInterval(() => {
    if(!latestRoom || !latestRoom.game)
        return;

    const g = latestRoom.game;
    const now = Date.now();

    // Full three-minute match clock
    const matchStart = g.matchStartAt || g.selectionStartAt;

    if(matchStart){
        const matchRemaining =
            180 - ((now - matchStart) / 1000);

        setMatchTime(matchRemaining);
    }

    // Five-second rest/selection countdown
    if(g.phase === "selection"){
        const selectionStart =
            g.selectionStartAt || now;

        const phaseRemaining =
            SELECTION_SECONDS -
            ((now - selectionStart) / 1000);

        setPhaseTime(
            Math.max(0, Math.ceil(phaseRemaining))
        );

        return;
    }

    // Ten-second battle countdown
    if(g.phase === "battle" && g.battle){
        const battleStart =
            g.battle.startAt || now;

        const battleDuration =
            g.battle.duration || BATTLE_SECONDS;

        const phaseRemaining =
            battleDuration -
            ((now - battleStart) / 1000);

        setPhaseTime(
            Math.max(0, Math.ceil(phaseRemaining))
        );

        return;
    }

    if(g.phase === "ended"){
        setPhaseTime(0);
    }

}, 100);

/* ---------------- INPUT ---------------- */
async function writeSelection(field, value){
    if(!latestRoom || latestRoom.game.phase !== "selection") return;
    await updateDoc(ref(), { [`game.${self()}.${field}`]: value });
}

function setupControls(){
    if(uiSetup) return;
    uiSetup = true;

    const board = document.getElementById("board");

    if(board){
        board.addEventListener("click", event => {
            if(!latestRoom || !latestRoom.game)
                return;

            if(latestRoom.game.phase !== "selection")
                return;

            const lane = event.target.closest(".lane-select");

            if(!lane)
                return;

            writeSelection("selectedLane", lane.dataset.lane);
        });
    }

    const skip = document.getElementById("skipBtn");

    if(skip){
        skip.onclick = async () => {
            await updateDoc(ref(), {
                [`game.${self()}.selectedIndex`]: null,
                [`game.${self()}.selectedLane`]: null
            });
        };
    }
    setReturnLobbyHandler(leaveRoom);
}


async function leaveRoom(){
    if(!latestRoom)
        return;

    await updateDoc(ref(), {
        state: "player-left",
        leftBy: auth.currentUser.uid,
        leftAt: Date.now()
    });

    returnToLobby();
}


function returnToLobby(){
    window.location.reload();
}
