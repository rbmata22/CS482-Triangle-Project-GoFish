import { useState, useEffect } from 'react'; // Import useEffect
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { MessageSquarePlus } from 'lucide-react';
import AddUser from '../ListChats/AddUser/AddUser';
import './HeadChats.css';

const HeadChats = () => {
    const [userData, setUserData] = useState({}); // Initialize state with useState
    const [isAddUser, setIsAddUser] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
          const userId = auth?.currentUser?.uid;
          if (userId) {
            const userDoc = await getDoc(doc(db, 'Users', userId));
            if (userDoc.exists()) {
              setUserData(userDoc.data());
            }
          }
        };
    
        fetchUserData();
    }, []); // Empty dependency array to run on component mount

    const handleAddUserClick = () => {
        setIsAddUser(prev => !prev);
    };

    return (
        <div className='headchats'>
            <div className='username'>
                <h6>{userData.username}</h6> {/* Display username */}
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
