import { useState } from 'react';
import { MessageSquarePlus, Search } from 'lucide-react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../../config/firebase';
import './AddUser.css';

const AddUser = ({ onNewConversation }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async (e) => {
        e.preventDefault();
        const usersRef = collection(db, 'Users');
        const q = query(usersRef, where('username', '==', searchTerm));
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSearchResults(results);
    };

    const createConversation = async (userId) => {
        const conversationsRef = collection(db, 'UserMessages');
        const newConversation = await addDoc(conversationsRef, {
            participants: [auth.currentUser.uid, userId],
            messages: []
        });
        onNewConversation(newConversation.id);
    };

    return (
        <div className="adduser">
            <form onSubmit={handleSearch}>
                <input 
                    type="text" 
                    placeholder='Username' 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">
                    <Search />
                </button>
            </form>
            {searchResults.map(user => (
                <div key={user.id} className='user-to-message'>
                    <div className='user-detail'>
                        <span>{user.username}</span>
                    </div>
                    <button onClick={() => createConversation(user.id)}>
                        <MessageSquarePlus />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default AddUser;