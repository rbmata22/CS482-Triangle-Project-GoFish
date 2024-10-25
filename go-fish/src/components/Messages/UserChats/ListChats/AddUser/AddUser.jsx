import { useState } from "react";
import { MessageSquarePlus, Search } from "lucide-react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../../../../config/firebase";
import "./AddUser.css";

const AddUser = ({ onNewConversation }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // Function to handle the search form submission
    const handleSearch = async (e) => {
        e.preventDefault();

        // Create a reference to the Users collection
        const usersRef = collection(db, "Users");
        // Create and execute a query to find users with matching username
        const q = query(usersRef, where("username", "==", searchTerm));
        const querySnapshot = await getDocs(q);

        // Map results and update the search results state
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSearchResults(results);
    };

    // Function to create a new conversation with a selected user
    const createConversation = async (userId) => {
        try {
            // Create a reference to the Conversations collection
            const conversationsRef = collection(db, "Conversations");
            const newConversation = await addDoc(conversationsRef, {
                participants: [auth.currentUser.uid, userId],
                messages: []
            });
            
            onNewConversation(newConversation.id);
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    return (
        <div className="adduser">
            <form onSubmit={handleSearch}>
                <input 
                    type="text" 
                    placeholder="Find user..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">
                    <Search />
                </button>
            </form>
            {searchResults.map(user => (
                <div key={user.id} className="user-to-message">
                    <div className="user-detail">
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