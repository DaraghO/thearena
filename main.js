import { db, auth, login } from "./firebase.js";
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

            await updateDoc(doc(db, "rooms", roomDoc.id), {

                player2: auth.currentUser.uid,

                state: "playing"

            });

            currentRoomId = roomDoc.id;
            watchRoom(currentRoomId);
            document.getElementById("status").innerText =
                "Joined room: " + room.name;

        };

        roomsDiv.appendChild(button);

    });

});

function watchRoom(roomId)
{
    const roomRef = doc(db, "rooms", roomId);

    onSnapshot(roomRef, (snapshot)=>{

        let room = snapshot.data();

        if(room.state === "playing")
        {
            document.getElementById("rooms").style.display = "none";
            document.getElementById("createRoom").style.display = "none";

            document.getElementById("game").style.display = "block";

            document.getElementById("players").innerText =
                "Player 1: " + room.host +
                "\nPlayer 2: " + room.player2;
        }

    });
}
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
watchRoom(currentRoomId);
document.getElementById("status").innerText =
    "You created: " + document.getElementById("roomName").value;

};
