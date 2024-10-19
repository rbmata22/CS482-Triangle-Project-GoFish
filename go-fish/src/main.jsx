import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from './components/App'
import Login from './components/Login/Login'
import SignUp from './components/SignUp/SignUp'
import Guest from './components/Guest/Guest'
import Home from './components/Home/Home'
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
      </Routes>
    </Router>
  </StrictMode>
);