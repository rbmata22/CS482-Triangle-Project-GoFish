import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Cat, Ghost, Dog, Bot, Bird } from 'lucide-react';
import './JoinPublic.css';

const renderUserLogo = (logo) => {
  switch (logo) {
    case 'Cat': return <Cat className="user-icon" />;
    case 'Ghost': return <Ghost className="user-icon" />;
    case 'Dog': return <Dog className="user-icon" />;
    case 'Bot': return <Bot className="user-icon" />;
    case 'Bird': return <Bird className="user-icon" />;
    default: return <Bird className="user-icon" />;
  }
};

const JoinPublic = () => {
  const [availableLobbies, setAvailableLobbies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLobbies = () => {
      const lobbiesRef = collection(db, 'Lobbies');
      const q = query(lobbiesRef, where('status', '==', 'setting up'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lobbies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableLobbies(lobbies);
      });

      return () => unsubscribe();
    };

    fetchLobbies();
  }, []);

  const handleJoinLobby = (lobbyId) => {
    navigate(`/lobby/${lobbyId}`);
  };

  return (
    <div className="join-public-container">
      <h2>Open Lobbies</h2>
      {availableLobbies.length > 0 ? (
        availableLobbies.map((lobby) => (
          <div key={lobby.id} className="lobby-item" onClick={() => handleJoinLobby(lobby.id)}>
            <div className="lobby-icon">
              {renderUserLogo(lobby.players[0]?.logo || 'Bird')}
            </div>
            <div className="lobby-username">{lobby.players[0]?.username || 'Unknown'}</div>
            <div className="lobby-player-count">
              {`${lobby.players.length} / ${lobby.playerLimit} Players`}
            </div>
          </div>
        ))
      ) : (
        <p>No lobbies available at the moment.</p>
      )}
    </div>
  );
};

export default JoinPublic;
