import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from './components/App'
import Login from './components/Login/Login'
import SignUp from './components/SignUp/SignUp'
import Guest from './components/Guest/Guest'
import Home from './components/Home/Home'
import Messages from './components/Messages/Messages';
import Friends from './components/Friends/Friends'
import CreatePublic from './components/Home/Create/CreatePublic'
import CreatePrivate from './components/Home/Create/CreatePrivate'
import JoinPublic from './components/Home/Join/JoinPublic';
import JoinPrivate from './components/Home/Join/JoinPrivate';
import Lobby from './components/Home/Lobby/Lobby'
import Shop from './components/Home/Shop/Shop'
import './index.css'


createRoot(document.getElementById('root')).render(
<StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/guest" element={<Guest />} />
        <Route path="/home" element={<Home />} />
        <Route path="/Messages" element={<Messages />} />
        <Route path="/Friends" element={<Friends />} />
        <Route path="/create-public" element={<CreatePublic />} />
        <Route path="/create-private" element={<CreatePrivate />} />
        <Route path="/join-public" element={<JoinPublic />} />
        <Route path="/join-private" element={<JoinPrivate />} />
        <Route path="/lobby/:lobbyId" element={<Lobby />} />
      </Routes>
    </Router>
  </StrictMode>
);