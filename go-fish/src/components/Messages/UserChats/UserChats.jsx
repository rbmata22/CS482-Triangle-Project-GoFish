import HeadChats from './HeadChats/HeadChats';
import ListChats from './ListChats/ListChats';
import './UserChats.css';

const UserChats = ({ onSelectConversation }) => {
    return (
        <div className='userchats'>
            <HeadChats onNewConversation={onSelectConversation} />
            <ListChats onSelectConversation={onSelectConversation} />
        </div>
    );
}

export default UserChats;