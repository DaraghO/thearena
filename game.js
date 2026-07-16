import { db } from "./firebase.js";
import { getRandomCards } from "./cards.js";
import {
    doc,
    onSnapshot,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


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

            document.getElementById("players").innerText =
                "Player 1: " + room.host +
                "\nPlayer 2: " + room.player2;


            // Only create the game once
            if(!room.game)
            {
                await createGame(roomRef);
            }
        }

    });
}



async function createGame(roomRef)
{
    await updateDoc(roomRef, {

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

    console.log("Game created");
}
