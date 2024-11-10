import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bot, ArrowLeft, Clock } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for unique code generation
import './CreatePrivate.css';

const deckOptions = {
  2: [15, 30, 52],
  3: [20, 35, 52],
  4: [25, 40, 52],
  5: [30, 45, 52],
  6: [35, 50, 52],
};

const CreatePrivate = () => {
  const [playerLimit, setPlayerLimit] = useState(4);
  const [useAI, setUseAI] = useState(true);
  const [loginCode] = useState(uuidv4().slice(0, 6).toUpperCase()); // Generate a 6-character login code
  const [deckSize, setDeckSize] = useState(deckOptions[4][0]); // Default to first option for 4 players
  const navigate = useNavigate();

  const handleCreateLobby = async () => {
    try {
      const ownerUsername = localStorage.getItem('username'); // Retrieve the owner's username

      // Add a new document with a generated ID to the Lobbies collection
      const docRef = await addDoc(collection(db, 'Lobbies'), {
        playerLimit,
        useAI,
        deckSize,
        players: [], // Initially empty; players will join later
        status: 'setting up', // Set the initial status as "setting up"
        createdAt: new Date(),
        lobbyType: 'private', // Mark as a private lobby
        lobbyCode: loginCode, // Save the login code for private access
        owner: ownerUsername, // Set the owner of the lobby
      });

      // Redirect to the Lobby page with the created lobby ID
      navigate(`/lobby/${docRef.id}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
    }
  };

  const handlePlayerLimitChange = (e) => {
    const limit = Number(e.target.value);
    setPlayerLimit(limit);
    setDeckSize(deckOptions[limit][0]); // Set deck size to the first option for the selected player limit
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <button className="back-button" onClick={() => navigate('/home')}>
          <ArrowLeft /> Back
        </button>
        
        <h2 className="lobby-title">Create Private Lobby</h2>
        
        <div className="lobby-settings">
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
              {[2, 3, 4, 5, 6].map(limit => (
                <option key={limit} value={limit}>{limit} Players</option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              <Bot className="setting-icon" />
              Fill Empty Slots with AI
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              <Clock className="setting-icon" />
              Deck Size (Game Length)
            </label>
            <select 
              value={deckSize} 
              onChange={(e) => setDeckSize(Number(e.target.value))}
              className="setting-select"
            >
              {deckOptions[playerLimit].map(size => (
                <option key={size} value={size}>
                  {size} Cards ({size === 52 ? 'Full Game' : size === deckOptions[playerLimit][0] ? 'Short' : 'Medium'})
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label">Login Code</label>
            <div className="login-code">{loginCode}</div>
          </div>
        </div>

        <button className="create-lobby-button" onClick={handleCreateLobby}>
          Create Lobby
        </button>
      </div>
    </div>
  );
};

export default CreatePrivate;
