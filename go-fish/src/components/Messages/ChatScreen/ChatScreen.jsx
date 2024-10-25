import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleUserRound, Send } from 'lucide-react';
import { 
    doc as firestoreDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import './ChatScreen.css';

const ChatScreen = ({ selectedConversation }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [otherUser, setOtherUser] = useState(null);
    const navigate = useNavigate();
    const auth = getAuth();

    // Set up real-time listener for messages
    useEffect(() => {
        if (!auth.currentUser) return;

        // Set up real-time listener
        const userMessageRef = firestoreDoc(db, 'UserMessages', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userMessageRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
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
        if (!selectedConversation || !auth.currentUser) return;
    
        const conversationRef = firestoreDoc(db, 'Conversations', selectedConversation);
        const unsubscribe = onSnapshot(conversationRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const otherUserId = data.participants.find(id => id !== auth.currentUser.uid);
                const userDocRef = firestoreDoc(db, 'Users', otherUserId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data();
                setOtherUser(userData);
                const sortedMessages = [...(data.messages || [])].sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                setMessages(sortedMessages);
            }
            setLoading(false);
        });
    
        return () => unsubscribe();
    }, [selectedConversation, auth.currentUser]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !auth.currentUser || !selectedConversation) return;
    
        try {
            const conversationRef = firestoreDoc(db, 'Conversations', selectedConversation);
            
            const newMessageObj = {
                text: newMessage,
                sender: auth.currentUser.uid,
                timestamp: new Date().toISOString()
            };
    
            await updateDoc(conversationRef, {
                messages: arrayUnion(newMessageObj)
            });
    
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
                    <span>{otherUser ? otherUser.username : 'Waiting for User...'}</span>
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
                            className={`message-container ${message.sender === auth.currentUser.uid ? 'sent' : 'received'}`}
                        >
                            <div className="message-bubble">
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