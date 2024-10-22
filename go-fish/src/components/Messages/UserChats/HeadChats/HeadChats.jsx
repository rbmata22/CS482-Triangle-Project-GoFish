import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import AddUser from '../ListChats/AddUser/AddUser';
import './HeadChats.css';

const HeadChats = () => {
    const [isAddUser, setIsAddUser] = useState(false);

    const handleAddUserClick = () => {
        setIsAddUser(prev => !prev);
    };

    return (
        <div className='headchats'>
            <div className='username'>
                <h6>TestUser123</h6>
            </div>
            <div className='newmessage'>
                <button onClick={handleAddUserClick}>
                    <MessageSquarePlus />
                </button>
            </div>
            {isAddUser && <AddUser />}
        </div>
    );
}

export default HeadChats;
