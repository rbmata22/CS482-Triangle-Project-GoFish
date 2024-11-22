import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bot, ArrowLeft, Clock, Trophy } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import './CreatePublic.css';
import oldgameMusic from "../../../assets/oldgame-music.mp3";

const deckOptions = {
  2: [15, 30, 52],
  3: [20, 35, 52],
  4: [25, 40, 52],
  5: [30, 45, 52],
  6: [35, 50, 52],
};

const gameModes = {
  classic: "Classic (Most Sets Wins)",
  firstToSet: "First to Set Wins",
};

const CreatePublic = () => {
  const [playerLimit, setPlayerLimit] = useState(4);
  const [useAI, setUseAI] = useState(true);
  const [deckSize, setDeckSize] = useState(deckOptions[4][0]); // Default to first option for 4 players
  const [gameMode, setGameMode] = useState('classic');
  const [isPlaying, setIsPlaying] = useState(false); // State for managing audio playback
  const navigate = useNavigate();

  const audio = new Audio(oldgameMusic);

  // Create a new public lobby
  const handleCreateLobby = async () => {
    try {
      const ownerUsername = localStorage.getItem('username'); // Retrieve the owner's username

      // Add a new document with a generated ID to the Lobbies collection
      const docRef = await addDoc(collection(db, 'Lobbies'), {
        playerLimit,
        useAI,
        deckSize,
        gameMode,
        players: [],
        status: 'setting up', // Initial status
        createdAt: new Date(),
        owner: ownerUsername, // Set the owner of the lobby
      });

      // Redirect to the Lobby page with the created lobby ID
      navigate(`/lobby/${docRef.id}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
    }
  };

  // Handle changes in player limit
  const handlePlayerLimitChange = (e) => {
    const limit = Number(e.target.value);
    setPlayerLimit(limit);
    setDeckSize(deckOptions[limit][0]); // Set deck size to the first option for the selected player limit
  };

  // Audio effect for background music
  useEffect(() => {
    audio.loop = true;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.log('Autoplay blocked:', err);
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []); 

  // Toggle music playback
  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.log('Music error:', err));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <button className="back-button" onClick={() => navigate('/home')}>
          <ArrowLeft /> Back
        </button>

        <h2 className="lobby-title">Create Public Lobby</h2>

        <div className="lobby-settings">
          <div className="setting-group">
            <label className="setting-label">
              <Trophy className="setting-icon" />
              Game Mode
            </label>
            <select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value)}
              className="setting-select"
            >
              {Object.entries(gameModes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              <Users className="setting-icon" />
              Player Limit
            </label>
            <select
              value={playerLimit}
              onChange={handlePlayerLimitChange}
              className="setting-select"
            >
              {[2, 3, 4, 5, 6].map((limit) => (
                <option key={limit} value={limit}>{limit} Players</option>
              ))}
            </select>
          </div>
        </div>

        <button className="create-lobby-button" onClick={handleCreateLobby}>
          Create Lobby
        </button>
      </div>
    </div>
  );
};

export default CreatePublic;
