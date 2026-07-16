console.log("main.js loaded");

import { db, auth, login } from "./firebase.js";
import { startGame } from "./game.js";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


await login();


const roomsDiv = document.getElementById("rooms");
const createButton = document.getElementById("createRoom");
let currentRoomId = null;

// Listen for rooms

onSnapshot(collection(db, "rooms"), (snapshot)=>{

    roomsDiv.innerHTML = "";

    let open = 0;

    snapshot.forEach((roomDoc)=>{

        const room = roomDoc.data();

        if(room.host === auth.currentUser.uid)
            return;

        if(room.player2 !== null)
            return;

        open++;

        const el = document.createElement("div");
        el.className = "room";
        el.innerHTML = `
            <span class="dot"></span>
            <div class="info">
                <div class="name"></div>
                <div class="sub">Host waiting</div>
            </div>
            <button class="btn-join">Join</button>`;

        el.querySelector(".name").textContent = room.name;

        el.querySelector(".btn-join").onclick = async () => {

            currentRoomId = roomDoc.id;
            startGame(currentRoomId);

            await updateDoc(doc(db, "rooms", roomDoc.id), {
                player2: auth.currentUser.uid,
                state: "playing"
            });

            document.getElementById("status").textContent = "Joined room: " + room.name;
        };

        roomsDiv.appendChild(el);

    });

    const countEl = document.getElementById("roomCount");
    if(countEl)
        countEl.textContent = open + (open === 1 ? " waiting" : " waiting");

    if(open === 0)
        roomsDiv.innerHTML = `<div class="empty">No open rooms. Create one to start.</div>`;

});


// Create room

createButton.onclick = async ()=>{

    const roomName = document.getElementById("roomName").value.trim();

    if(roomName === "")
    {
        alert("Please enter a room name.");
        return;
    }

    const roomsSnapshot = await getDocs(collection(db, "rooms"));

    let exists = false;

    roomsSnapshot.forEach((roomDoc)=>{
        if(roomDoc.data().name.toLowerCase() === roomName.toLowerCase())
            exists = true;
    });

    if(exists)
    {
        alert("A room with that name already exists.");
        return;
    }

    const roomRef = await addDoc(collection(db, "rooms"), {
        name: roomName,
        host: auth.currentUser.uid,
        player2: null,
        state: "waiting",
        created: serverTimestamp()
    });

    currentRoomId = roomRef.id;
    startGame(currentRoomId);

    document.getElementById("status").textContent = "You created: " + roomName;

};
