import { useState } from "react";
import { Search, House } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FriendRequests from "./FriendRequests/FriendRequests";
import UserFriends from "./UserFriends/UserFriends";
import { db, auth } from "../config/firebase";
import { collection, query, where, getDocs, addDoc, getDoc, doc, updateDoc, arrayUnion  } from "firebase/firestore";
import "./Friends.css";

const Friends = () => {
    const [searchUsername, setSearchUsername] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchError, setSearchError] = useState("");
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchUsername.trim()) return;

        try {
            const usersRef = collection(db, "Users");
            const q = query(usersRef, where("username", "==", searchUsername));
            const querySnapshot = await getDocs(q);

            const results = [];
            querySnapshot.forEach((doc) => {
                // Don't include the current user in search results
                if (doc.id !== auth.currentUser.uid) {
                    results.push({ id: doc.id, ...doc.data() });
                }
            });

            setSearchResults(results);
            if (results.length === 0) {
                setSearchError("No user found with that username");
            } else {
                setSearchError("");
            }
        } catch (error) {
            console.error("Error searching for user:", error);
            setSearchError("Error searching for user");
        }
    };

    const sendFriendRequest = async (recipientId, recipientUsername) => {
        try {
            // Get sender's data
            const senderDoc = await getDoc(doc(db, "Users", auth.currentUser.uid));
            const senderData = senderDoc.data();

            // Create friend request
            const friendRequestsRef = collection(db, "FriendRequests");
            await addDoc(friendRequestsRef, {
                senderId: auth.currentUser.uid,
                senderUsername: senderData.username,
                recipientId: recipientId,
                recipientUsername: recipientUsername,
                status: "pending",
                timestamp: new Date().toISOString()
            });

            // Update recipient's pending requests array
            const recipientRef = doc(db, "Users", recipientId);
            await updateDoc(recipientRef, {
                pendingFriendRequests: arrayUnion(auth.currentUser.uid)
            });

            setSearchResults([]);
            setSearchUsername("");
        } catch (error) {
            console.error("Error sending friend request:", error);
        }
    };

    // Handling path changes if user wants to go to another page
    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <div className="friends-container">
            <button className="home-button" onClick={() => handleNavigate("/home")}>
                <House className="back-icon" /> Home
            </button>
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                        placeholder="Search for users..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">
                        <Search size={20} />
                    </button>
                </form>
                
                {searchError && <p className="search-error">{searchError}</p>}
                
                {searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map((user) => (
                            <div key={user.id} className="search-result-item">
                                <span>{user.username}</span>
                                <button 
                                    onClick={() => sendFriendRequest(user.id, user.username)}
                                    className="send-request-button"
                                >
                                    Send Friend Request
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="friends-content">
                <UserFriends />
                <FriendRequests />
            </div>
        </div>
    );
};

export default Friends;