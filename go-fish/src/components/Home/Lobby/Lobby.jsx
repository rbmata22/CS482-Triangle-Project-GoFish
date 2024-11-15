import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, deleteDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import BetPopUp from './BetPopUp';
import { Cat, Ghost, Dog, Bot, Bird, Dices, BadgeDollarSign, SquareCheck } from 'lucide-react';
import './Lobby.css';

const botNames = ["SpongeBot Squarepants", "LeBot James", "Botman", "J.A.R.V.I.S", "Ultron", "Cyborg"];

const Lobby = () => {
  const { lobbyId } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [showBet, setShowBet] = useState(false);
  const [userData, setUserData] = useState({});
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  const toggleBet = () => setShowBet(!showBet);

  useEffect(() => {
    if (!lobbyId) return;

    const lobbyRef = doc(db, 'Lobbies', lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, (doc) => {
      if (doc.exists()) {
        setLobbyData(doc.data());
      } else {
        localStorage.setItem('ownerLeftMessage', 'Owner of session has left');
        navigate('/home');
      }
    });

    return () => unsubscribe();
  }, [lobbyId, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      const authType = localStorage.getItem('authType');
      if (authType === 'Guest') {
        const guestData = {
          username: localStorage.getItem('username'),
          logo: localStorage.getItem('logo'),
          guestId: localStorage.getItem('guestId'),
          virtualCurrency: 500,
          isReady: false,
        };
        setUserData(guestData);
      } else {
        const userId = auth.currentUser?.uid;
        if (userId) {
          try {
            const userDoc = await getDoc(doc(db, 'Users', userId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUserData({
                username: data.username,
                logo: data.logo,
                virtualCurrency: data.virtualCurrency || 500,
                isReady: false,
              });
            }
          } catch (error) {
            console.error("Error fetching user data: ", error);
          }
        }
      }
    };
    fetchUserData();
  }, [navigate]);

  const allRealUsersReady = (players) => players.every(player => player.isReady || player.logo === "Bot");

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
    const logoComponents = {
      'Cat': Cat,
      'Ghost': Ghost,
      'Dog': Dog,
      'Bot': Bot,
      'Bird': Bird,
      default: Dices,
    };
    const LogoComponent = logoComponents[logo] || logoComponents.default;
    return <LogoComponent className="user-logo" />;
  };

  const handleReadyToggle = async () => {
    const lobbyRef = doc(db, 'Lobbies', lobbyId);
    const updatedPlayers = lobbyData.players.map((player) =>
      player.username === userData.username ? { ...player, isReady: !player.isReady } : player
    );

    await updateDoc(lobbyRef, { players: updatedPlayers });
    setIsReady(!isReady);

    if (lobbyData.useAI && allRealUsersReady(updatedPlayers)) {
      addAIPlayers();
    }
  };

  const handleLeaveLobby = async () => {
    if (lobbyData.owner === userData.username) {
      await deleteDoc(doc(db, 'Lobbies', lobbyId));
    } else {
      navigate('/home');
    }
  };

  useEffect(() => {
    if (lobbyData && userData.username && !lobbyData.players.some(player => player.username === userData.username)) {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);

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
      navigate(`/lobby/${lobbyId}/bet`, { state: { lobbyId, bettingTotal: lobbyData.bettingTotal } });
    } else {
      alert('Not all players are ready!');
    }
  };

  const handlePlaceBet = async (amount) => {
    try {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);
      const currentTotal = lobbyData.bettingTotal || 0;
      
      // Update the lobby's betting total
      await updateDoc(lobbyRef, {
        bettingTotal: currentTotal + amount
      });
  
      // Update the player's bet status
      const updatedPlayers = lobbyData.players.map(player =>
        player.username === userData.username
          ? { ...player, betPlaced: true, betAmount: amount }
          : player
      );
      await updateDoc(lobbyRef, { players: updatedPlayers });
  
      // Update user's virtual currency
      if (auth.currentUser?.uid) {
        const userRef = doc(db, 'Users', auth.currentUser.uid);
        await updateDoc(userRef, {
          virtualCurrency: userData.virtualCurrency - amount
        });
      }
      
      setShowBet(false);
    } catch (error) {
      console.error("Error placing bet:", error);
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

            <div className="bet-pool-display">
              <h2 className='lobby-header'>- Current Bet Pool -</h2>
              <div className='bet-pool-amount'>
                <BadgeDollarSign />
                <span>1000</span>
              </div>
            </div>

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
            <button className="footer-button" onClick={handleLeaveLobby}>Leave Lobby</button>
            <button className="footer-button" onClick={handleReadyToggle}>
              {lobbyData.players.some(p => p.username === userData.username && p.isReady) ? 'Unready' : 'Ready'}
            </button>
            <button className="footer-button" onClick={toggleBet}>Place Bet</button>
            {showBet && (<BetPopUp onClose={() => setShowBet(false)} userData={userData} onPlaceBet={handlePlaceBet}/>)}
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
