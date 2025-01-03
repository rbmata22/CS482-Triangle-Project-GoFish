import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, deleteDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { 
  Cat, 
  Ghost, 
  Dog, 
  Bot, 
  Bird, 
  Dices, 
  Apple, 
  Banana, 
  Cherry, 
  Grape, 
  Candy, 
  Pizza, 
  Croissant, 
  Gem, 
  BadgeDollarSign, 
  Trophy, 
  SquareCheck 
} from 'lucide-react';
import './Lobby.css';
import lobbyMusic from '../../../assets/lobby-music.mp3';

const botNames = ["SpongeBot Squarepants", "LeBot James", "Botman", "J.A.R.V.I.S", "Ultron", "Cyborg"];

const Lobby = () => {
  const { lobbyId } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [showBet, setShowBet] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [userData, setUserData] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [audio] = useState(new Audio(lobbyMusic));
  const navigate = useNavigate();

  const toggleBet = () => setShowBet(!showBet);

  // Calculate total betting pool
  const calculateBettingTotal = (players) => {
    if (!players || !Array.isArray(players)) return 0;
    return players.reduce((total, player) => {
      const bet = player?.betAmount || 0;
      return total + (typeof bet === 'number' ? bet : 0);
    }, 0);
  };

  // Lobby data listener
  useEffect(() => {
    if (!lobbyId) return;

    const lobbyRef = doc(db, 'Lobbies', lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const bettingTotal = calculateBettingTotal(data.players);
        setLobbyData({ ...data, bettingTotal });
      } else {
        localStorage.setItem('ownerLeftMessage', 'Owner of session has left');
        navigate('/home');
      }
    });

    return () => unsubscribe();
  }, [lobbyId, navigate]);

  // Currency listener
  useEffect(() => {
    const authType = localStorage.getItem('authType');
    let unsubscribe;

    const setupCurrencyListener = async () => {
      try {
        if (authType === 'Guest') {
          const guestId = localStorage.getItem('guestId');
          if (guestId) {
            const guestRef = doc(db, 'Guests', guestId);
            unsubscribe = onSnapshot(guestRef, (doc) => {
              if (doc.exists()) {
                const data = doc.data();
                setUserData(prev => ({
                  ...prev,
                  virtualCurrency: data.virtualCurrency
                }));
              }
            });
          }
        } else {
          const userId = auth.currentUser?.uid;
          if (userId) {
            const userRef = doc(db, 'Users', userId);
            unsubscribe = onSnapshot(userRef, (doc) => {
              if (doc.exists()) {
                const data = doc.data();
                setUserData(prev => ({
                  ...prev,
                  virtualCurrency: data.virtualCurrency
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error("Error setting up currency listener:", error);
      }
    };

    setupCurrencyListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const authType = localStorage.getItem('authType');
      if (authType === 'Guest') {
        const guestId = localStorage.getItem('guestId');
        try {
          const guestDoc = await getDoc(doc(db, 'Guests', guestId));
          if (guestDoc.exists()) {
            const guestData = guestDoc.data();
            setUserData({
              username: guestData.username || localStorage.getItem('username'),
              logo: guestData.logo || localStorage.getItem('logo'),
              guestId: guestId,
              virtualCurrency: guestData.virtualCurrency,
              isReady: false,
            });
          } else {
            setUserData({
              username: localStorage.getItem('username'),
              logo: localStorage.getItem('logo'),
              guestId: guestId,
              virtualCurrency: parseInt(localStorage.getItem('guestCurrency')) || 500,
              isReady: false,
            });
          }
        } catch (error) {
          console.error("Error fetching guest data: ", error);
        }
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
                virtualCurrency: data.virtualCurrency,
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
  }, []);

  // Music handling
  useEffect(() => {
    audio.loop = true;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.log("Autoplay blocked:", err);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.log("Music playback error:", err));
    }
    setIsPlaying(!isPlaying);
  };

  // Join lobby logic
  useEffect(() => {
    if (lobbyData && userData.username && !lobbyData.players.some(player => player.username === userData.username)) {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);
      updateDoc(lobbyRef, {
        players: arrayUnion({
          username: userData.username,
          logo: userData.logo,
          isReady: userData.isReady,
          virtualCurrency: userData.virtualCurrency
        })
      });
    }
  }, [lobbyData, userData, lobbyId]);

const renderUserLogo = (logo) => {
  const logoComponents = {
    'Cat': Cat,
    'Ghost': Ghost,
    'Dog': Dog,
    'Bot': Bot,
    'Bird': Bird,
    'Apple': Apple,
    'Banana': Banana,
    'Cherry': Cherry,
    'Grape': Grape,
    'Candy': Candy,
    'Croissant': Croissant,
    'Pizza': Pizza,
    'Gem': Gem,
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
};

const handleLeaveLobby = async () => {
  if (lobbyData.owner === userData.username) {
    await deleteDoc(doc(db, 'Lobbies', lobbyId));
  } else {
    navigate('/home');
  }
};

const handleGoFish = async () => {
  if (!allPlayersReady) {
    alert('Not all players are ready!');
    return;
  }

  try {
    const lobbyRef = doc(db, 'Lobbies', lobbyId);
    const finalBettingTotal = calculateBettingTotal(lobbyData.players);

    // Update final betting total in lobby before starting game
    await updateDoc(lobbyRef, {
      bettingTotal: finalBettingTotal
    });

    // Add real-time currency listener
    const authType = localStorage.getItem('authType');
    let userRef;

    if (authType === 'Guest') {
      const guestId = localStorage.getItem('guestId');
      userRef = doc(db, 'Guests', guestId);
    } else {
      userRef = doc(db, 'Users', auth.currentUser?.uid);
    }

    // Navigate to the game with betting information
    navigate(`/lobby/${lobbyId}/game`, { 
      state: { 
        lobbyId, 
        bettingTotal: finalBettingTotal 
      } 
    });
  } catch (error) {
    console.error("Error starting game:", error);
    alert("Error starting game. Please try again.");
  }
};

const allPlayersReady = lobbyData?.players.every(player => player.isReady);

const handlePlaceBet = async () => {
  try {
    if (!betAmount || betAmount <= 0) {
      alert('Please enter a valid bet amount!');
      return;
    }

    if (betAmount > userData.virtualCurrency) {
      alert('Insufficient funds!');
      return;
    }

    const authType = localStorage.getItem('authType');
    let userRef;

    // Get the appropriate user reference
    if (authType === 'Guest') {
      const guestId = localStorage.getItem('guestId');
      userRef = doc(db, 'Guests', guestId);
    } else {
      userRef = doc(db, 'Users', auth.currentUser?.uid);
    }

    // First update user's currency and pending bets
    await updateDoc(userRef, {
      virtualCurrency: userData.virtualCurrency - betAmount,
      pendingBets: betAmount
    });

    const lobbyRef = doc(db, 'Lobbies', lobbyId);
      
    // Update the players array with the new bet
    const updatedPlayers = lobbyData.players.map(player =>
      player.username === userData.username
        ? { ...player, betAmount: betAmount }
        : player
    );

    // Update lobby with new players array and betting total
    await updateDoc(lobbyRef, { 
      players: updatedPlayers,
      bettingTotal: (lobbyData.bettingTotal || 0) + betAmount
    });
    
    // Update local userData state
    setUserData(prev => ({
      ...prev,
      virtualCurrency: prev.virtualCurrency - betAmount
    }));
    
    // Reset bet amount and close popup
    setBetAmount(0);
    setShowBet(false);

  } catch (error) {
    console.error("Error placing bet:", error);
    alert("Error placing bet. Please try again.");
  }
};

const renderPlayerItem = (player, index) => {
  if (!player) {
    return <p className="placeholder">Empty Slot</p>;
  }

  return (
    <>
      {renderUserLogo(player.logo)}
      <div className="player-info">
        <p className="player-name">{player.username}</p>
        <p className="player-status">
          {player.isReady ? 
            <SquareCheck className="ready-icon" style={{ color: 'green' }} /> : 
            'Not Ready'
          }
        </p>
        {player.betAmount > 0 && (
          <p className="player-bet">
            <BadgeDollarSign className="bet-icon" size={16} />
            {player.betAmount}
          </p>
        )}
      </div>
    </>
  );
};

const BetPopup = () => (
  <div className="bet-popup-wrapper">
    <div className="bet-popup">
      <button className="close-button" onClick={() => {
        setShowBet(false);
        setBetAmount(0);
      }}>
        Close
      </button>
      <h2>Place Your Bet</h2>
      <div className="bet-info">
        <p>Available Balance: ${userData.virtualCurrency}</p>
        {betAmount > 0 && <p>Remaining Balance: ${userData.virtualCurrency - betAmount}</p>}
      </div>
      <input
        type="number"
        min="1"
        max={userData.virtualCurrency}
        value={betAmount}
        onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
        placeholder="Enter bet amount"
      />
      <button 
        onClick={handlePlaceBet}
        disabled={betAmount <= 0 || betAmount > userData.virtualCurrency}
        className="place-bet-button"
      >
        Place Bet
      </button>
    </div>
  </div>
);

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

        <div className="lobby-content-wrapper">
          <div className="lobby-card">
            <h2 className="lobby-header">{`${lobbyData.players[0]?.username || 'Lobby'}'s Lobby`}</h2>

            <div className="bet-pool-display">
              <h2 className="lobby-header">- Current Bet Pool -</h2>
              <div className="bet-pool-amount">
                <BadgeDollarSign />
                <span>{lobbyData.bettingTotal || 0}</span>
              </div>
            </div>

            <div className="game-mode-display">
              <span className="mode-text">
                {lobbyData.gameMode === 'firstToSet' ? 'First to Set Wins!' : 'Classic Mode'}
              </span>
            </div>

            {lobbyData.lobbyType === 'private' && (
              <div className="login-code-container">
                <p className="login-code-label">Login Code:</p>
                <p className="login-code-value">{lobbyData.lobbyCode}</p>
              </div>
            )}

            <div className="player-list">
              {[...Array(lobbyData.playerLimit)].map((_, index) => (
                <div key={index} className="player-item">
                  {renderPlayerItem(lobbyData.players[index], index)}
                </div>
              ))}
            </div>
          </div>

          {showBet && <BetPopup />}
        </div>

        <div className="lobby-footer">
          <button className="footer-button" onClick={handleLeaveLobby}>Leave Lobby</button>
          <button className="footer-button" onClick={handleReadyToggle}>
            {lobbyData.players.some(p => p.username === userData.username && p.isReady) ? 'Unready' : 'Ready'}
          </button>
          <button className="footer-button" onClick={toggleBet}>Place Bet</button>
          <button 
            className="go-fish-button" 
            onClick={handleGoFish} 
            disabled={!allPlayersReady} 
            style={{ backgroundColor: allPlayersReady ? 'green' : '#555' }}
          >
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