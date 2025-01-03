import { useEffect, useState } from "react";
import { CircleUserRound, Cat, Ghost, Dog, Bot, Bird } from "lucide-react";
import { collection, query, where, onSnapshot, getDoc, doc as firestoreDoc } from "firebase/firestore";
import { db, auth } from "../../../config/firebase";
import "./ListChats.css";

const ListChats = ({ onSelectConversation }) => {
    const [conversations, setConversations] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Effect to check and update authentication status
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsAuthenticated(!!user);
        });

        return () => unsubscribe();
    }, []);

    const renderUserLogo = (logo) => {
        switch (logo) {
            case 'Cat':
                return <Cat className="user-logo" />;
            case 'Ghost':
                return <Ghost className="user-logo" />;
            case 'Dog':
                return <Dog className="user-logo" />;
            case 'Bot':
                return <Bot className="user-logo" />;
            case 'Bird':
                return <Bird className="user-logo" />;
            default:
                return <CircleUserRound className="user-logo" />;
        }
    };

    // Effect to fetch and listen for changes in conversations
    useEffect(() => {
        if (!isAuthenticated) return;

        const conversationsRef = collection(db, "Conversations");
        const q = query(conversationsRef, where("participants", "array-contains", auth.currentUser.uid));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const conversationsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                const otherUserId = data.participants.find(id => id !== auth.currentUser.uid);
                const userDocRef = firestoreDoc(db, "Users", otherUserId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data();

                return {
                    id: docSnapshot.id,
                    ...data,
                    otherUser: userData ? userData.username : "Unknown User",
                    userLogo: userData ? userData.logo : null // Add the logo information
                };
            }));

            setConversations(conversationsData);
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    const truncateMessage = (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    if (!isAuthenticated) {
        return <div>Loading...</div>;
    }

    return (
        <div className="listchats">
            {conversations.map(conversation => (
                <div key={conversation.id} className="user" onClick={() => onSelectConversation(conversation.id)}>
                    {renderUserLogo(conversation.userLogo)}
                    <div className="chats">
                        <span>{conversation.otherUser}</span>
                        <p>
                            {conversation.messages.length > 0
                                ? truncateMessage(conversation.messages[conversation.messages.length - 1].text, 12)
                                : "No messages yet"}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ListChats;