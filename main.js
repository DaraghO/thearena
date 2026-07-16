import { db, auth, login } from "./firebase.js";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


await login();


const roomsDiv = document.getElementById("rooms");
const createButton = document.getElementById("createRoom");
let currentRoomId = null;

// Listen for rooms

onSnapshot(collection(db, "rooms"), (snapshot)=>{

    roomsDiv.innerHTML = "";

    snapshot.forEach((roomDoc)=>{

    let room = roomDoc.data();

    let button = document.createElement("button");

    button.innerText = "Join " + room.name;

    button.onclick = async () => {

    await updateDoc(doc(db, "rooms", roomDoc.id), {

        player2: auth.currentUser.uid,

        state: "playing"

    });

    currentRoomId = roomDoc.id;

    document.getElementById("status").innerText =
    "Joined room: " + room.name;

};

    roomsDiv.appendChild(button);

});

});


// Create room

createButton.onclick = async ()=>{

    const roomRef = await addDoc(collection(db, "rooms"), {

    name: document.getElementById("roomName").value || "Unnamed Room",
    host: auth.currentUser.uid,

    player2: null,

    state: "waiting",

    created: serverTimestamp()

});

currentRoomId = roomRef.id;

document.getElementById("status").innerText =
    "You created: " + document.getElementById("roomName").value;

};
