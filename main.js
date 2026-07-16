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

    snapshot.forEach((roomDoc)=>{

        let room = roomDoc.data();

        if(room.host === auth.currentUser.uid)
        {
            return;
        }

        if(room.player2 !== null)
        {
            return;
        }

        let button = document.createElement("button");

        button.innerText = "Join " + room.name;

        button.onclick = async () => {

    currentRoomId = roomDoc.id;

    startGame(currentRoomId);

    await updateDoc(doc(db, "rooms", roomDoc.id), {

        player2: auth.currentUser.uid,
        state: "playing"

    });

    document.getElementById("status").innerText =
        "Joined room: " + room.name;

};

        roomsDiv.appendChild(button);

    });

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
    {
        exists = true;
    }
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
    document.getElementById("status").innerText =
    "You created: " + document.getElementById("roomName").value;

};
