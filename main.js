import { db, login } from "./firebase.js";

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


// Listen for rooms

onSnapshot(collection(db, "rooms"), (snapshot)=>{

    roomsDiv.innerHTML = "";

    snapshot.forEach((doc)=>{

        let room = doc.data();

        let button = document.createElement("button");

button.innerText = "Join " + room.name;

button.onclick = async () => {

await updateDoc(doc(db, "rooms", doc.id), {

    player2: crypto.randomUUID(),

    state: "playing"

});
};

roomsDiv.appendChild(button);

    });

});


// Create room

createButton.onclick = async ()=>{

    await addDoc(collection(db, "rooms"), {

        name: "Room " + Math.floor(Math.random()*10000),

        host: crypto.randomUUID(),

        player2: null,

        state: "waiting",

        created: serverTimestamp()

    });

};
