import { db } from "./firebase.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


export function startGame(roomId)
{
    const roomRef = doc(db, "rooms", roomId);

    onSnapshot(roomRef, (snapshot)=>{

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
        }

    });
}
