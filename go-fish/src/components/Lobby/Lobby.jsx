import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, onSnapshot, updateDoc, query, where, getDocs, getDoc } from "firebase/firestore";
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
  const [availableLobbies, setAvailableLobbies] = useState([]);
  const [lobbyType, setLobbyType] = useState("public"); // 'public' or 'private'

  // Function to generate a unique lobby code (for private lobbies)
  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Function to create a new lobby (public or private)
  const createLobby = async () => {
    setIsCreatingLobby(true);

    const newLobbyCode = lobbyType === "private" ? generateLobbyCode() : null; // Only generate code for private lobbies
    try {
      // Add a new lobby document to Firestore
      const docRef = await addDoc(collection(db, "lobbies"), {
        type: lobbyType,
        code: newLobbyCode, // Will be null for public lobbies
        players: [],
        status: "waiting"
      });

      setLobbyId(docRef.id);
      setLobbyCode(newLobbyCode); // Set the lobby code only if it's private
      setPlayerId("Host");
      setIsCreatingLobby(false);
    } catch (error) {
      console.error("Error creating lobby: ", error);
      setIsCreatingLobby(false);
    }
  };

  // Function to fetch all available public lobbies
  const fetchPublicLobbies = async () => {
    try {
      const q = query(collection(db, "lobbies"), where("type", "==", "public"), where("status", "==", "waiting"));
      const querySnapshot = await getDocs(q);

      let fetchedLobbies = [];
      querySnapshot.forEach((doc) => {
        fetchedLobbies.push({ id: doc.id, ...doc.data() });
      });

      setAvailableLobbies(fetchedLobbies);
    } catch (error) {
      console.error("Error fetching public lobbies: ", error);
    }
  };

  // Function to join a public lobby
  const joinPublicLobby = async (lobbyId) => {
    try {
      const lobbyRef = doc(db, "lobbies", lobbyId);
      const lobbySnapshot = await getDoc(lobbyRef);

      if (lobbySnapshot.exists()) {
        // Add the new player to the lobby
        await updateDoc(lobbyRef, {
          players: [...lobbySnapshot.data().players, { id: "Player_" + Math.random().toString(36).substring(2, 8) }]
        });

        setLobbyId(lobbySnapshot.id);
        setPlayerId("Player_" + Math.random().toString(36).substring(2, 8));
      } else {
        alert("Lobby not found");
      }
    } catch (error) {
      console.error("Error joining lobby: ", error);
    }
  };

  // Function to join a private lobby using a lobby code
  const joinPrivateLobby = async (lobbyCode) => {
    try {
      const q = query(collection(db, "lobbies"), where("code", "==", lobbyCode));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const lobbyDoc = querySnapshot.docs[0];
        const lobbyData = lobbyDoc.data();

        // Add the new player to the private lobby
        await updateDoc(lobbyDoc.ref, {
          players: [...lobbyData.players, { id: "Player_" + Math.random().toString(36).substring(2, 8) }]
        });

        setLobbyId(lobbyDoc.id);
        setPlayerId("Player_" + Math.random().toString(36).substring(2, 8));
      } else {
        alert("Private lobby not found");
      }
    } catch (error) {
      console.error("Error joining private lobby: ", error);
    }
  };

  // Listen for changes in the lobby (for real-time updates of players)
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

  // Fetch public lobbies on component mount
  useEffect(() => {
    fetchPublicLobbies();
  }, []);

  return (
    <div className="go-fish-lobby-container">
      <h2>Go Fish Lobby</h2>
      
      {lobbyId ? (
        <div className="lobby-details">
          <h3>Lobby Type: {lobbyType === "private" ? "Private" : "Public"}</h3>
          {lobbyType === "private" && <h3>Lobby Code: {lobbyCode}</h3>}
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
          <label>
            Lobby Type:
            <select value={lobbyType} onChange={(e) => setLobbyType(e.target.value)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          
          <button onClick={createLobby} className="create-lobby-btn" disabled={isCreatingLobby}>
            {isCreatingLobby ? "Creating Lobby..." : `Create ${lobbyType === "private" ? "Private" : "Public"} Lobby`}
          </button>

          {lobbyType === "private" && (
            <div className="join-lobby">
              <input
                type="text"
                placeholder="Enter Private Lobby Code"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value)}
              />
              <button onClick={() => joinPrivateLobby(lobbyCode)} className="join-lobby-btn">
                Join Private Lobby
              </button>
            </div>
          )}

          <div className="available-lobbies">
            {lobbyType === "public" && (
              <>
                <h4>Join a Public Lobby</h4>
                {availableLobbies.length === 0 ? (
                  <p>No public lobbies available</p>
                ) : (
                  <ul>
                    {availableLobbies.map((lobby) => (
                      <li key={lobby.id}>
                        <span>Lobby ID: {lobby.id}</span>
                        <button onClick={() => joinPublicLobby(lobby.id)} className="join-lobby-btn">
                          Join
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoFishLobby;
