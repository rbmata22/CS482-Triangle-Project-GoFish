import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './JoinPrivate.css';

const JoinPrivate = () => {
  const [lobbyCode, setLobbyCode] = useState('');
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
        // Navigate to the lobby page with the correct lobby ID
        const lobbyDoc = querySnapshot.docs[0];
        const lobbyId = lobbyDoc.id;
        navigate(`/lobby/${lobbyId}`);
      }
    } catch (error) {
      console.error('Error joining lobby:', error);
      setErrorMessage('An error occurred while trying to join the lobby.');
    }
  };

  return (
    <div className="join-private-container">
      <h2 className="join-private-title">Join Private Lobby</h2>
      <div className="join-private-form">
        <input
          type="text"
          className="lobby-code-input"
          placeholder="Enter Lobby Code"
          value={lobbyCode}
          onChange={(e) => setLobbyCode(e.target.value)}
        />
        <button className="join-button" onClick={handleJoinLobby}>
          Join Lobby
        </button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default JoinPrivate;
