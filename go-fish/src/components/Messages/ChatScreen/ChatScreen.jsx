import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleUserRound, Send } from 'lucide-react';
import './ChatScreen.css';

const ChatScreen = () => {
    const [messages, setMessages] = useState([
        { text: "", sender: "other" },
        { text: "", sender: "self" }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, { text: newMessage, sender: "self" }]);
            setNewMessage('');
        }
    };

    return (
        <div className='chatscreen'>
            <div className='top'>
                <button className="back-button" onClick={() => handleNavigate('/home')}>
                    <ArrowLeft className="back-icon" /> Home
                </button>
                <CircleUserRound />
                <div className='usermessage'>
                    <span>UserUser123</span>
                </div>
            </div>
            <div className='middle'>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={message.sender === "self" ? 'own-message' : 'message'}
                    >
                        <div className='text'>
                            <p>{message.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className='bottom'>
                <div className='message-icons'></div>
                <input
                    type="text"
                    placeholder='Begin typing your message here...'
                    value={newMessage}
                    onChange={handleInputChange}
                />
                <button className='send-button' onClick={handleSendMessage}>
                    <Send />
                </button>
            </div>
        </div>
    );
}

export default ChatScreen;
