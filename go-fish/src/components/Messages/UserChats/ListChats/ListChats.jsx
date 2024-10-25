import { useEffect, useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { collection, query, where, onSnapshot, getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import './ListChats.css';

const ListChats = ({ onSelectConversation }) => {
    const [conversations, setConversations] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsAuthenticated(!!user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        const conversationsRef = collection(db, 'Conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', auth.currentUser.uid));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const conversationsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                const otherUserId = data.participants.find(id => id !== auth.currentUser.uid);
                const userDocRef = firestoreDoc(db, 'Users', otherUserId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data();
                return {
                    id: docSnapshot.id,
                    ...data,
                    otherUser: userData ? userData.username : 'Unknown User'
                };
            }));
            setConversations(conversationsData);
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <div>Loading...</div>;
    }

    return (
        <div className='listchats'>
            {conversations.map(conversation => (
                <div key={conversation.id} className='user' onClick={() => onSelectConversation(conversation.id)}>
                    <CircleUserRound />
                    <div className='chats'>
                        <span>{conversation.otherUser}</span>
                        <p>{conversation.messages[conversation.messages.length - 1]?.text || 'No messages yet'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ListChats