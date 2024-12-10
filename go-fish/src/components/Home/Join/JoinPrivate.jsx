import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Check, X, Cat, Ghost, Dog, Bot, Bird } from 'lucide-react';
import './JoinPrivate.css';

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

const JoinPrivate = () => {
  const [lobbyCode, setLobbyCode] = useState('');
  const [lobbyDetails, setLobbyDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleJoinLobby = async () => {
    setErrorMessage(''); // Clear previous error message

    if (!lobbyCode) {
      setErrorMessage('Please enter a lobby code.');
      return;
    }

    try {
      const lobbiesRef = collection(db, 'Lobbies');
      const q = query(
        lobbiesRef,
        where('lobbyCode', '==', lobbyCode),
        where('status', '==', 'setting up'),
        where('lobbyType', '==', 'private')
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMessage('Invalid or inactive lobby code.');
      } else {
        const lobbyDoc = querySnapshot.docs[0];
        setLobbyDetails({ id: lobbyDoc.id, ...lobbyDoc.data() });
      }
    } catch (error) {
      console.error('Error joining lobby:', error);
      setErrorMessage('An error occurred while trying to join the lobby.');
    }
  };

  const joinLobby = () => {
    navigate(`/lobby/${lobbyDetails.id}`);
  };

  const handleBack = () => {
    setLobbyDetails(null); // Reset lobby details view
    setLobbyCode(''); // Clear lobby code input
    setErrorMessage(''); // Clear any previous error message
  };

  return (
    <div className="join-private-container">
      {lobbyDetails ? (
        <div className="lobby-details-view">
          <h2 className="lobby-title">Lobby Details</h2>
          <div className="lobby-info">
            <p><strong>Lobby Code:</strong> {lobbyCode}</p>
            <p><strong>Player Limit:</strong> {lobbyDetails.playerLimit}</p>
            <p><strong>AI Fill:</strong> {lobbyDetails.useAI ? 'Enabled' : 'Disabled'}</p>
            <p><strong>Players:</strong></p>
            <ul>
              {lobbyDetails.players.map((player, index) => (
                <li key={index} className="player-info">
                  {renderUserLogo(player.logo)} {player.username}
                </li>
              ))}
            </ul>
          </div>
          <div className="lobby-action-buttons">
            <button className="join-button" onClick={joinLobby}><Check /> Join Lobby</button>
            <button className="back-button" onClick={handleBack}><X /> Back</button>
          </div>
        </div>
      ) : (
        <div className="join-private-form">
          <h2 className="join-private-title">Join Private Lobby</h2>
          <input
            type="text"
            className="lobby-code-input"
            placeholder="Enter Lobby Code"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value)}
          />
          <button className="submit-button" onClick={handleJoinLobby}>
            Join Lobby
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button className="back-button" onClick={() => navigate(-1)}><X /> Back</button>
        </div>
      )}
    </div>
  );
};

export default JoinPrivate;
