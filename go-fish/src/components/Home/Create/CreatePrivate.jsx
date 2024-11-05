import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bot, ArrowLeft } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for unique code generation
import './CreatePrivate.css';

const CreatePrivate = () => {
  const [playerLimit, setPlayerLimit] = useState(4);
  const [useAI, setUseAI] = useState(true);
  const [loginCode] = useState(uuidv4().slice(0, 6).toUpperCase()); // Generate a 6-character login code
  const navigate = useNavigate();

  const handleCreateLobby = async () => {
    try {
      const ownerUsername = localStorage.getItem('username'); // Retrieve the owner's username

      // Add a new document with a generated ID to the Lobbies collection
      const docRef = await addDoc(collection(db, 'Lobbies'), {
        playerLimit,
        useAI,
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
              onChange={(e) => setPlayerLimit(Number(e.target.value))}
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
