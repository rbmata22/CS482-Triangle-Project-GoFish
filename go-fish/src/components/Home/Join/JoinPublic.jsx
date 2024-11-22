import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Cat, Ghost, Dog, Bot, Bird, Check, X } from 'lucide-react';
import './JoinPublic.css';
import oldgameMusic from "../../../assets/oldgame-music.mp3";

const JoinPublic = () => {
  const [availableLobbies, setAvailableLobbies] = useState([]);
  const [expandedLobby, setExpandedLobby] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); // State to track music playback
  const navigate = useNavigate();

  const audio = new Audio(oldgameMusic);

  // Fetch public lobbies
  useEffect(() => {
    const fetchLobbies = () => {
      const lobbiesRef = collection(db, 'Lobbies');
      const q = query(lobbiesRef, where('status', '==', 'setting up'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lobbies = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((lobby) => lobby.lobbyType !== 'private'); // Filter out private lobbies
        setAvailableLobbies(lobbies);
      });

      return () => unsubscribe();
    };

    fetchLobbies();
  }, []);

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

  const handleJoinLobby = (lobbyId) => {
    navigate(`/lobby/${lobbyId}`);
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const toggleLobbyDetails = (lobbyId) => {
    setExpandedLobby(expandedLobby === lobbyId ? null : lobbyId);
  };

  const renderUserLogo = (logo) => {
    switch (logo) {
      case 'Cat':
        return <Cat className="user-icon" />;
      case 'Ghost':
        return <Ghost className="user-icon" />;
      case 'Dog':
        return <Dog className="user-icon" />;
      case 'Bot':
        return <Bot className="user-icon" />;
      case 'Bird':
        return <Bird className="user-icon" />;
      default:
        return <Bird className="user-icon" />;
    }
  };

  return (
    <div className="join-public-container">
      <button className="back-button" onClick={handleBack}>
        <X /> Back
      </button>
      <h2>Open Lobbies</h2>
      {availableLobbies.length > 0 ? (
        availableLobbies.map((lobby) => (
          <div key={lobby.id} className={`lobby-item ${expandedLobby === lobby.id ? 'expanded' : ''}`}>
            <div className="lobby-summary" onClick={() => toggleLobbyDetails(lobby.id)}>
              <div className="lobby-icon">
                {renderUserLogo(lobby.players[0]?.logo || 'Bird')}
              </div>
              <div className="lobby-username">{lobby.players[0]?.username || 'Unknown'}</div>
              <div className="lobby-player-count">
                {`${lobby.players.length} / ${lobby.playerLimit} Players`}
              </div>
            </div>

            {expandedLobby === lobby.id && (
              <div className="lobby-details">
                <p><strong>Lobby Type:</strong> {lobby.lobbyType}</p>
                <p><strong>Players:</strong></p>
                <ul>
                  {lobby.players.map((player, index) => (
                    <li key={index}>{player.username} ({player.logo})</li>
                  ))}
                </ul>
                <button className="join-button" onClick={() => handleJoinLobby(lobby.id)}>
                  <Check /> Join Lobby
                </button>
                <button className="collapse-button" onClick={() => toggleLobbyDetails(null)}>
                  <X /> Back
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="no-lobbies-message">No lobbies available at the moment.</p>
      )}
    </div>
  );
};

export default JoinPublic;
