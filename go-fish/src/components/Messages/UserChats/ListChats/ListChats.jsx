import { useEffect, useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import './ListChats.css';

const ListChats = ({ onSelectConversation }) => {
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const conversationsRef = collection(db, 'Conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', auth.currentUser.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const conversationsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setConversations(conversationsData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className='listchats'>
            {conversations.map(conversation => (
                <div key={conversation.id} className='user' onClick={() => onSelectConversation(conversation.id)}>
                    <CircleUserRound />
                    <div className='chats'>
                        <span>{conversation.participants.find(id => id !== auth.currentUser.uid)}</span>
                        <p>{conversation.messages[conversation.messages.length - 1]?.text || 'No messages yet'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ListChats;