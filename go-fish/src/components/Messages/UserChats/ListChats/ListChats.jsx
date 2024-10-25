import { CircleUserRound } from 'lucide-react';
import './ListChats.css';
import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const ListChats = () => {
    const [addMode, setAddMode] = useState(false);

    return (
        <div className='listchats'>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser123</span>
                    <p>Hello there!</p>
                </div>
            </div>
        </div>
    );
}

export default ListChats;