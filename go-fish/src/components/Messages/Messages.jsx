import { useState } from 'react';
import UserChats from "./UserChats/UserChats";
import ChatScreen from "./ChatScreen/ChatScreen";
import './Messages.css';

const Messages = () => {
    const [selectedConversation, setSelectedConversation] = useState(null);

    return (
        <div className="container">
            <UserChats onSelectConversation={setSelectedConversation} />
            <ChatScreen selectedConversation={selectedConversation} />
        </div>
    );
}

export default Messages;