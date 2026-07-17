console.log("main.js loaded");

import { db, auth, login } from "./firebase.js";
import { startGame } from "./game.js";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


await login();


const roomsDiv = document.getElementById("rooms");
const createButton = document.getElementById("createRoom");
let currentRoomId = null;
let hostedRoomId = null;
const WAITING_ROOM_STALE_MS = 15000;
const ROOM_CLEANUP_INTERVAL_MS = 5000;

let cleaningRooms = false;
// Listen for rooms

onSnapshot(collection(db, "rooms"), (snapshot)=>{

    roomsDiv.innerHTML = "";

    let visibleRooms = 0;
    hostedRoomId = null;

    snapshot.forEach((roomDoc)=>{

        const room = roomDoc.data();
        const isMine = room.host === auth.currentUser.uid;
        const isWaiting = room.state === "waiting";
        const isFull = room.player2 !== null;

        // Only display rooms which are waiting for a player.
        if(!isWaiting || isFull)
            return;

        visibleRooms++;

        if(isMine)
            hostedRoomId = roomDoc.id;

        const element = document.createElement("div");
        element.className = "room";

        element.innerHTML = `
            <span class="dot"></span>

            <div class="info">
                <div class="name"></div>
                <div class="sub"></div>
            </div>

            <div class="room-actions"></div>
        `;

        element.querySelector(".name").textContent = room.name;

        const sub = element.querySelector(".sub");
        const actions = element.querySelector(".room-actions");

        if(isMine){
            sub.textContent = "Your room · waiting for opponent";

            const closeButton = document.createElement("button");
            closeButton.className = "btn-close-room";
            closeButton.textContent = "Close";

            closeButton.onclick = async () => {
                closeButton.disabled = true;

                try{
                    await deleteDoc(doc(db, "rooms", roomDoc.id));

                    if(currentRoomId === roomDoc.id)
                        currentRoomId = null;

                    hostedRoomId = null;

                    document.getElementById("status").textContent =
                        "Room closed.";
                }
                catch(error){
                    console.error("Could not close room:", error);
                    closeButton.disabled = false;
                }
            };

            actions.appendChild(closeButton);
        }
        else{
            sub.textContent = "Host waiting";

            const joinButton = document.createElement("button");
            joinButton.className = "btn-join";
            joinButton.textContent = "Join";

            joinButton.onclick = async () => {
                currentRoomId = roomDoc.id;

                startGame(currentRoomId);

                await updateDoc(doc(db, "rooms", roomDoc.id), {
    player2: auth.currentUser.uid,
    state: "playing",
    "presence.player2": Date.now()
});

                document.getElementById("status").textContent =
                    "Joined room: " + room.name;
            };

            actions.appendChild(joinButton);
        }

        roomsDiv.appendChild(element);
    });

    const countElement = document.getElementById("roomCount");

    if(countElement){
        countElement.textContent =
            visibleRooms +
            (visibleRooms === 1 ? " room" : " rooms");
    }

    if(visibleRooms === 0){
        roomsDiv.innerHTML =
            `<div class="empty">No open rooms. Create one to start.</div>`;
    }
});


// Create room

createButton.onclick = async () => {

    const roomName =
        document.getElementById("roomName").value.trim();

    if(roomName === ""){
        alert("Please enter a room name.");
        return;
    }

    createButton.disabled = true;

    try{
        const roomsSnapshot =
            await getDocs(collection(db, "rooms"));

        let duplicateName = false;
        let existingHostedRoom = null;

        roomsSnapshot.forEach((roomDoc) => {
            const room = roomDoc.data();

            if(
    room.name.toLowerCase() === roomName.toLowerCase() &&
    (
        room.state === "waiting" ||
        room.state === "playing"
    )
){
    duplicateName = true;
}

            if(
                room.host === auth.currentUser.uid &&
                room.state === "waiting"
            ){
                existingHostedRoom = roomDoc;
            }
        });

        if(existingHostedRoom){
            alert(
                "You already have an open room. Close it before creating another."
            );
            return;
        }

        if(duplicateName){
            alert("A room with that name already exists.");
            return;
        }

        const roomReference =
            await addDoc(collection(db, "rooms"), {
                name: roomName,
                host: auth.currentUser.uid,
                player2: null,
                state: "waiting",
created: serverTimestamp(),

presence: {
    player1: Date.now(),
    player2: null
}
            });

        currentRoomId = roomReference.id;
        hostedRoomId = roomReference.id;

        startGame(currentRoomId);

        document.getElementById("status").textContent =
            "You created: " + roomName;
    }
    catch(error){
        console.error("Could not create room:", error);
        alert("The room could not be created.");
    }
    finally{
        createButton.disabled = false;
    }
};


async function cleanupStaleRooms()
{
    if(cleaningRooms)
        return;

    cleaningRooms = true;

    try
    {
        const snapshot =
            await getDocs(collection(db, "rooms"));

        const now = Date.now();
        const deletions = [];

        snapshot.forEach(roomDoc => {

            const room = roomDoc.data();

            const player1LastSeen =
                room.presence?.player1 ?? 0;

            const player2LastSeen =
                room.presence?.player2 ?? 0;

            const player1Stale =
                !player1LastSeen ||
                now - player1LastSeen > 15000;

            const player2Stale =
                !player2LastSeen ||
                now - player2LastSeen > 15000;

            if(
                room.state === "waiting" &&
                player1Stale
            ){
                deletions.push(
                    deleteDoc(
                        doc(db, "rooms", roomDoc.id)
                    )
                );

                return;
            }

            if(
                room.state === "playing" &&
                player1Stale &&
                player2Stale
            ){
                deletions.push(
                    deleteDoc(
                        doc(db, "rooms", roomDoc.id)
                    )
                );

                return;
            }

            if(
                room.game?.phase === "ended" &&
                player1Stale &&
                player2Stale
            ){
                deletions.push(
                    deleteDoc(
                        doc(db, "rooms", roomDoc.id)
                    )
                );
            }
        });

        await Promise.allSettled(deletions);
    }
    catch(error)
    {
        console.error(
            "Could not clean stale rooms:",
            error
        );
    }
    finally
    {
        cleaningRooms = false;
    }
}

cleanupStaleRooms();

setInterval(
    cleanupStaleRooms,
    ROOM_CLEANUP_INTERVAL_MS
);
