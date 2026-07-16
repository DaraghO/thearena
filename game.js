import { db, auth } from "./firebase.js";

import {
    doc,
    onSnapshot,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


export function startGame(roomId)
{
    const roomRef = doc(db, "rooms", roomId);

    onSnapshot(roomRef, async (snapshot)=>{

        if(!snapshot.exists())
            return;

        const room = snapshot.data();

        if(room.state !== "playing")
            return;

        console.log("Game running", room);

    });
}
