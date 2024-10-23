import HeadChats from './HeadChats/HeadChats';
import ListChats from './ListChats/ListChats';
import './UserChats.css';

const UserChats = () => {
    return (
        <div className='userchats'>
            <HeadChats/>
            <ListChats/>
        </div>
    );
}

export default UserChats;