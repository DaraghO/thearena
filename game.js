import { db, auth } from "./firebase.js";
import { getRandomCards } from "./cards.js";

import {
    doc,
    onSnapshot,
    updateDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

console.log("game.js loaded");
let selectedCard = null;
let selectedLane = null;
let laneButtonsSetup = false;

export function startGame(roomId)
{
    const roomRef = doc(db, "rooms", roomId);

    onSnapshot(roomRef, async (snapshot)=>{

        let room = snapshot.data();

        if(!room)
            return;


        if(room.state === "playing")
        {
            document.getElementById("rooms").style.display = "none";
            document.getElementById("createRoom").style.display = "none";
            document.getElementById("roomName").style.display = "none";

            document.getElementById("game").style.display = "block";
            setupLaneButtons(roomId);
            document.getElementById("players").innerText =
                "Player 1: " + room.host +
                "\nPlayer 2: " + room.player2;


            // Only create the game once
            if(!room.game)
            {
                await createGame(roomRef);
                return;
            }


            renderCards(room);
        }

    });
}



async function createGame(roomRef)
{
    await runTransaction(db, async (transaction)=>{

        const snapshot = await transaction.get(roomRef);

        const room = snapshot.data();

        // Someone else already created the game
        if(room.game)
        {
            return;
        }


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

            }

        });

    });


    console.log("Game created");
}



function renderCards(room)
{
    const cardsDiv = document.getElementById("cards");

    if(!cardsDiv)
        return;

    cardsDiv.innerHTML = "";


    let playerKey;

    if(auth.currentUser.uid === room.host)
    {
        playerKey = "player1";
    }
    else
    {
        playerKey = "player2";
    }


    if(!room.game[playerKey])
        return;


    let hand = room.game[playerKey].hand;


    hand.forEach(card => {

        let button = document.createElement("button");

        button.innerText =
            card.name +
            "\nCost: " +
            card.cost;


        if(room.game[playerKey].selectedCard === card.id)
        {
            button.style.border = "3px solid yellow";
        }


        button.onclick = async () => {

            await selectCard(room, playerKey, card.id);

        };


        cardsDiv.appendChild(button);

    });


    highlightLanes(room, playerKey);
}

async function selectCard(room, playerKey, cardId)
{
    const roomRef = doc(db, "rooms", room.id);

    await updateDoc(roomRef, {

        [`game.${playerKey}.selectedCard`]: cardId

    });
}


function setupLaneButtons(roomId)
{
    if(laneButtonsSetup)
        return;

    laneButtonsSetup = true;


    document.querySelectorAll(".laneButton").forEach(button => {

        button.onclick = async () => {

            const lane = button.dataset.lane;

            const roomRef = doc(db, "rooms", currentRoomId);

            let playerKey;

            if(auth.currentUser.uid === currentRoom.host)
            {
                playerKey = "player1";
            }
            else
            {
                playerKey = "player2";
            }


            await updateDoc(roomRef, {

                [`game.${playerKey}.selectedLane`]: lane

            });

        };

    });
}
