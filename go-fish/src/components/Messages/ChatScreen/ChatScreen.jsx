import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleUserRound, Send } from 'lucide-react';
import { 
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import './ChatScreen.css';

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const auth = getAuth();

    // Set up real-time listener for messages
    useEffect(() => {
        if (!auth.currentUser) return;

        // Set up real-time listener
        const userMessageRef = doc(db, 'UserMessages', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userMessageRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                // Sort messages by timestamp
                const sortedMessages = [...(data.messages || [])].sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                setMessages(sortedMessages);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages: ", error);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [auth.currentUser]);

    // Scroll to bottom when messages update
    useEffect(() => {
        const messageContainer = document.querySelector('.middle');
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !auth.currentUser) return;

        try {
            const userMessageRef = doc(db, 'UserMessages', auth.currentUser.uid);
            
            // Create new message object
            const newMessageObj = {
                text: newMessage,
                sender: "self",
                timestamp: new Date().toISOString(),
                userId: auth.currentUser.uid
            };

            // Add message to Firestore array
            await updateDoc(userMessageRef, {
                messages: arrayUnion(newMessageObj)
            });

            // Clear input (no need to update local state as the listener will handle it)
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message: ", error);
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
                {loading ? (
                    <div className="loading-messages">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="no-messages">No messages yet</div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={`${message.timestamp}-${index}`}
                            className={message.sender === "self" ? 'own-message' : 'message'}
                        >
                            <div className='text'>
                                <p>{message.text}</p>
                            </div>
                            <div className="message-timestamp">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className='bottom'>
                <div className='message-icons'></div>
                <input
                    type="text"
                    placeholder='Begin typing your message here...'
                    value={newMessage}
                    onChange={handleInputChange}
                    disabled={loading}
                />
                <button 
                    className='send-button' 
                    onClick={handleSendMessage}
                    disabled={loading}
                >
                    <Send />
                </button>
            </div>
        </div>
    );
}

export default ChatScreen;