import UserChats from "../Messages/UserChats/UserChats";
import ChatScreen from "../Messages/ChatScreen/ChatScreen";
import './Messages.css';

const Messages = () => {
    return (
        <div className="container">
            <UserChats />
            <ChatScreen />
        </div>
    );
}

export default Messages;