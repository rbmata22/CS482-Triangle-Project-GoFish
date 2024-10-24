import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import './GoFishLobby.css'; // CSS for styling

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB46N4Kl3URAID2WJPMLnFHpZAVSxXjaKk",
  authDomain: "go-fish-b5da8.firebaseapp.com",
  projectId: "go-fish-b5da8",
  storageBucket: "go-fish-b5da8.appspot.com",
  messagingSenderId: "778081614040",
  appId: "1:778081614040:web:84fe9bb7215ea008db3fad",
  measurementId: "G-DBGHQRETSQ"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GoFishLobby = () => {
  const [lobbyId, setLobbyId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);

  // Function to generate a unique lobby code
  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Function to create a new private lobby
  const createLobby = async () => {
    setIsCreatingLobby(true);
    const newLobbyCode = generateLobbyCode();

    try {
      const docRef = await addDoc(collection(db, "lobbies"), {
        code: newLobbyCode,
        players: [],
        status: "waiting"
      });

      setLobbyId(docRef.id);
      setLobbyCode(newLobbyCode);
      setPlayerId("Host");
      setIsCreatingLobby(false);
    } catch (error) {
      console.error("Error creating lobby: ", error);
      setIsCreatingLobby(false);
    }
  };

  // Function to join an existing lobby
  const joinLobby = async (lobbyCode) => {
    try {
      const lobbyRef = doc(db, "lobbies", lobbyCode);
      const lobbySnapshot = await getDoc(lobbyRef);

      if (lobbySnapshot.exists()) {
        // Add the new player to the lobby
        await updateDoc(lobbyRef, {
          players: [...lobbySnapshot.data().players, { id: "Player_" + Math.random().toString(36).substring(2, 8) }]
        });

        setLobbyId(lobbySnapshot.id);
        setLobbyCode(lobbyCode);
        setPlayerId("Player_" + Math.random().toString(36).substring(2, 8));
      } else {
        alert("Lobby not found");
      }
    } catch (error) {
      console.error("Error joining lobby: ", error);
    }
  };

  // Listen for changes in the lobby
  useEffect(() => {
    if (lobbyId) {
      const unsubscribe = onSnapshot(doc(db, "lobbies", lobbyId), (doc) => {
        if (doc.exists()) {
          setPlayers(doc.data().players);
        }
      });

      return () => unsubscribe();
    }
  }, [lobbyId]);

  return (
    <div className="go-fish-lobby-container">
      <h2>Go Fish Private Lobby</h2>
      
      {lobbyId ? (
        <div className="lobby-details">
          <h3>Lobby Code: {lobbyCode}</h3>
          <h4>Players in Lobby:</h4>
          <ul>
            {players.map((player, index) => (
              <li key={index}>{player.id}</li>
            ))}
          </ul>

          {players.length > 1 && <button className="start-game-btn">Start Game</button>}
        </div>
      ) : (
        <div className="lobby-creation">
          <button onClick={createLobby} className="create-lobby-btn" disabled={isCreatingLobby}>
            {isCreatingLobby ? "Creating Lobby..." : "Create New Lobby"}
          </button>

          <div className="join-lobby">
            <input
              type="text"
              placeholder="Enter Lobby Code"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
            />
            <button onClick={() => joinLobby(lobbyCode)} className="join-lobby-btn">
              Join Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoFishLobby;
