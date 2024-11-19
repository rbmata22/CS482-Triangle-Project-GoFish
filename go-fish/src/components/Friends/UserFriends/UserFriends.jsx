import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../config/firebase";
import { UserMinus, MessageSquare, HandCoins } from 'lucide-react';
import { doc, getDoc, onSnapshot, updateDoc, arrayRemove, setDoc, collection, increment } from "firebase/firestore";
import "./UserFriends.css";

const UserFriends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingFriend, setRemovingFriend] = useState(null);
    const [startingChat, setStartingChat] = useState(null);
    const [userCurrency, setUserCurrency] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.currentUser) return;

        const userRef = doc(db, "Users", auth.currentUser.uid);
        
        const unsubscribe = onSnapshot(userRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const friendsList = userData.friends || [];
                
                // Fetch friend details
                const friendsData = await Promise.all(
                    friendsList.map(async (friendId) => {
                        const friendDoc = await getDoc(doc(db, "Users", friendId));
                        return { id: friendId, ...friendDoc.data() };
                    })
                );
                
                setFriends(friendsData);
                setUserCurrency(userData.virtualCurrency || 0); // Set user's currency
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRemoveFriend = async (friendId, friendUsername) => {
        try {
            setRemovingFriend(friendId);
            const userId = auth.currentUser.uid;

            // Remove friend from current user's friends list
            const userRef = doc(db, "Users", userId);
            await updateDoc(userRef, {
                friends: arrayRemove(friendId)
            });

            // Remove current user from friend's friends list
            const friendRef = doc(db, "Users", friendId);
            await updateDoc(friendRef, {
                friends: arrayRemove(userId)
            });

            // Update local state
            setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
            
        } catch (error) {
            console.error("Error removing friend:", error);
            alert("Failed to remove friend. Please try again.");
        } finally {
            setRemovingFriend(null);
        }
    };

    const handleStartChat = async (friendId) => {
        try {
            setStartingChat(friendId);
            const userId = auth.currentUser.uid;

            // Create a unique conversation ID by sorting and combining user IDs
            const participantIds = [userId, friendId].sort();
            const conversationId = participantIds.join('_');

            // Check if conversation already exists
            const conversationRef = doc(db, "Conversations", conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                // Create new conversation if it doesn't exist
                await setDoc(conversationRef, {
                    participants: participantIds,
                    messages: [],
                    createdAt: new Date().toISOString()
                });
            }

            // Navigate to Messages with the conversation ID
            navigate('/Messages', { state: { selectedConversation: conversationId } });

        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Failed to start chat. Please try again.");
        } finally {
            setStartingChat(null);
        }
    };

    // THIS IS HIP TOO - Ryland Mata
    /* Figuring out how to send virtual currency between users was a bit
     * troubling, so finally figuring it out was really satisfying. This
     * was cool because it allows for updating the information of two different
     * users at the same time. It is also a cool, different feature outside
     * of just adding or removing a friend.
    */
    const handleSendCurrency = async (friendId) => {
        if (userCurrency < 100) {
            alert("You do not have enough currency to send!");
            return;
        }

        try {
            const userId = auth.currentUser .uid;
            const userRef = doc(db, "Users", userId);
            const friendRef = doc(db, "Users", friendId);

            // Update user's currency
            await updateDoc(userRef, {
                virtualCurrency: userCurrency - 100
            });

            // Update friend's currency
            await updateDoc(friendRef, {
                virtualCurrency: increment(100) // Increment the friend's currency by 100
            });

            // Update local state
            setUserCurrency(prev => prev - 100);
            alert("Successfully sent 100 currency!");
        } catch (error) {
            console.error("Error sending currency:", error);
            alert("Failed to send currency. Please try again.");
        }
    };

    if (loading) {
        return <div>Loading friends...</div>;
    }

    return (
        <div className="user-friends">
            <h2>Your Friends</h2>
            {friends.length === 0 ? (
                <p className="no-friends">No friends added yet</p>
            ) : (
                <div className="friends-list">
                    {friends.map((friend) => (
                        <div key={friend.id} className="friend-item">
                            <span className="friend-username">{friend.username}</span>
                            <div className="friend-actions">
                                <button
                                    className={`message-friend-btn ${startingChat === friend.id ? 'starting' : ''}`}
                                    onClick={() => handleStartChat(friend.id)}
                                    disabled={startingChat === friend.id}
                                >
                                    {startingChat === friend.id ? 'Opening Chat...' : <MessageSquare />}
                                </button>
                                <button
                                    className="send-currency-btn"
                                    onClick={() => handleSendCurrency(friend.id)}
                                    disabled={userCurrency < 100} // Disable if not enough currency
                                >
                                    <HandCoins />
                                </button>
                                <button
                                    className={`remove-friend-btn ${removingFriend === friend.id ? 'removing' : ''}`}
                                    onClick={() => handleRemoveFriend(friend.id, friend.username)}
                                    disabled={removingFriend === friend.id}
                                >
                                    {removingFriend === friend.id ? 'Removing...' : <UserMinus />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserFriends;