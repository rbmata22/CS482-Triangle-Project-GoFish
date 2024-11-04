import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird, Dices, BadgeDollarSign, SquareCheck } from 'lucide-react';
import './Lobby.css';

const botNames = ["Botty", "LeBot James", "Goku", "Optimus", "Cyber", "RoboCop"];

const Lobby = () => {
  const { lobbyId } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [userData, setUserData] = useState({});
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!lobbyId) return;

    const fetchLobbyData = async () => {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);

      // Real-time listener for lobby data
      const unsubscribe = onSnapshot(lobbyRef, (doc) => {
        if (doc.exists()) {
          setLobbyData(doc.data());
        } else {
          console.log("Lobby not found");
          navigate('/home');
        }
      });

      return () => unsubscribe();
    };

    const fetchUserData = async () => {
      const guestUsername = localStorage.getItem('username');
      const guestLogo = localStorage.getItem('logo');
      const guestId = localStorage.getItem('guestId');
      setUserData({
        username: guestUsername,
        logo: guestLogo,
        guestId: guestId,
        virtualCurrency: 500,
        isReady: false,
      });
    };

    fetchLobbyData();
    fetchUserData();
  }, [lobbyId, navigate]);

  const allRealUsersReady = (players) => {
    return players.every(player => player.isReady || player.logo === "Bot");
  };

  const addAIPlayers = async () => {
    const emptySlots = lobbyData.playerLimit - lobbyData.players.length;
    if (emptySlots <= 0) return;

    const bots = Array.from({ length: emptySlots }, (_, i) => ({
      username: botNames[i % botNames.length],
      logo: "Bot",
      isReady: true,
    }));

    try {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);
      await updateDoc(lobbyRef, {
        players: arrayUnion(...bots),
      });
    } catch (error) {
      console.error('Error adding bots:', error);
    }
  };

  const renderUserLogo = (logo) => {
    switch (logo) {
      case 'Cat': return <Cat className="user-logo" />;
      case 'Ghost': return <Ghost className="user-logo" />;
      case 'Dog': return <Dog className="user-logo" />;
      case 'Bot': return <Bot className="user-logo" />;
      case 'Bird': return <Bird className="user-logo" />;
      default: return <Dices className="user-logo" />;
    }
  };

  const handleReadyToggle = async () => {
    const lobbyRef = doc(db, 'Lobbies', lobbyId);
    const updatedPlayers = lobbyData.players.map((player) =>
      player.username === userData.username ? { ...player, isReady: !player.isReady } : player
    );

    await updateDoc(lobbyRef, { players: updatedPlayers });
    setIsReady(!isReady);

    // Check if all real players are ready before adding AI
    if (lobbyData.useAI && allRealUsersReady(updatedPlayers)) {
      addAIPlayers();
    }
  };

  // Ensure user is added to a slot
  useEffect(() => {
    if (lobbyData && userData.username && !lobbyData.players.some(player => player.username === userData.username)) {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);

      // Add user to the lobby if not already present
      updateDoc(lobbyRef, {
        players: arrayUnion({
          username: userData.username,
          logo: userData.logo,
          isReady: userData.isReady,
        })
      });
    }
  }, [lobbyData, userData, lobbyId]);

  const allPlayersReady = lobbyData?.players.every(player => player.isReady);

  const handleGoFish = () => {
    if (allPlayersReady) {
      navigate('/game'); 
    } else {
      alert('Not all players are ready!!!');
    }
  };

  return (
    <div className="lobby-container">
      {lobbyData ? (
        <>
          <div className="user-info-top-left">
            {renderUserLogo(userData.logo)}
            <span className="username">{userData.username}</span>
            <div className="currency-info">
              <BadgeDollarSign className="currency-icon" style={{ color: 'green' }} />
              <span className="currency-value" style={{ color: 'white' }}>{userData.virtualCurrency}</span>
            </div>
          </div>

          <div className="lobby-card">
            <h2 className="lobby-header">{`${lobbyData.players[0]?.username || 'Lobby'}'s Lobby`}</h2>

            {lobbyData.lobbyType === 'private' && (
              <div className="login-code-container">
                <p className="login-code-label">Login Code:</p>
                <p className="login-code-value">{lobbyData.lobbyCode}</p>
              </div>
            )}

            <div className="player-list">
              {[...Array(lobbyData.playerLimit)].map((_, index) => {
                const player = lobbyData.players[index];
                
                return (
                  <div key={index} className="player-item">
                    {player ? (
                      <>
                        {renderUserLogo(player.logo)}
                        <p className="player-name">{player.username}</p>
                        <p className="player-status">
                          {player.isReady ? <SquareCheck className="ready-icon" style={{ color: 'green' }} /> : 'Not Ready'}
                        </p>
                      </>
                    ) : (
                      <p className="placeholder">Empty Slot</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lobby-footer">
            <button className="footer-button" onClick={() => navigate('/home')}>Back</button>
            <button className="footer-button" onClick={handleReadyToggle}>
              {lobbyData.players.some(p => p.username === userData.username && p.isReady) ? 'Unready' : 'Ready'}
            </button>
            <button className="go-fish-button" onClick={handleGoFish} disabled={!allPlayersReady} style={{ backgroundColor: allPlayersReady ? 'green' : '#555' }}>
              GO FISH!
            </button>
          </div>
        </>
      ) : (
        <p>Loading lobby...</p>
      )}
    </div>
  );
};

export default Lobby;
