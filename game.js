import { db, auth } from "./firebase.js";
import { getRandomCards } from "./cards.js";
import { drawBoard, drawHand, setSelectedLane } from "./render.js";

import {
    doc,
    onSnapshot,
    updateDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

console.log("game.js loaded");

let uiSetup = false;
let currentRoomId = null;
let currentRoom = null;

function selfKey(room){
    return auth.currentUser.uid === room.host ? "player1" : "player2";
}

export function startGame(roomId)
{
    currentRoomId = roomId;

    const roomRef = doc(db, "rooms", roomId);

    onSnapshot(roomRef, async (snapshot)=>{

        const room = snapshot.data();

        if(!room)
            return;

        currentRoom = room;

        if(room.state === "playing")
        {
            document.getElementById("lobby").classList.add("hidden");
            document.getElementById("game").classList.remove("hidden");

            setupControls();

            // Only create the game once
            if(!room.game)
            {
                await createGame(roomRef);
                return;
            }

            renderState(room, roomId);
        }

    });
}


function renderState(room, roomId)
{
    const self = selfKey(room);

    drawBoard(room, self);
    drawHand(room, self, (cardId) => selectCard(roomId, self, cardId));
    setSelectedLane(room.game[self].selectedLane);
}


async function createGame(roomRef)
{
    await runTransaction(db, async (transaction)=>{

        const snapshot = await transaction.get(roomRef);
        const room = snapshot.data();

        if(room.game)
            return;

        transaction.update(roomRef, {

            game: {

                phase: "selection",
                turn: 1,
                timeRemaining: 5,

                player1: {
                    gold: 10,
                    hand: getRandomCards(3),
                    selectedCard: null,
                    selectedLane: null
                },

                player2: {
                    gold: 10,
                    hand: getRandomCards(3),
                    selectedCard: null,
                    selectedLane: null
                },

                battlefield: {
                    lane1: [],
                    lane2: [],
                    lane3: []
                },

                towers: {
                    player1: { left: 1000, middle: 1000, right: 1000, king: 3000 },
                    player2: { left: 1000, middle: 1000, right: 1000, king: 3000 }
                }

            }

        });

    });

    console.log("Game created");
}


async function selectCard(roomId, self, cardId)
{
    await updateDoc(doc(db, "rooms", roomId), {
        [`game.${self}.selectedCard`]: cardId
    });
}


function setupControls()
{
    if(uiSetup)
        return;

    uiSetup = true;

    document.querySelectorAll(".lane-btn").forEach(button => {

        button.onclick = async () => {

            const lane = button.dataset.lane;
            const self = selfKey(currentRoom);

            await updateDoc(doc(db, "rooms", currentRoomId), {
                [`game.${self}.selectedLane`]: lane
            });

        };

    });

    const skip = document.getElementById("skipBtn");
    if(skip)
    {
        skip.onclick = async () => {

            const self = selfKey(currentRoom);

            await updateDoc(doc(db, "rooms", currentRoomId), {
                [`game.${self}.selectedCard`]: null
            });

        };
    }
}
