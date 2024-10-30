import { useState, useEffect } from "react";
import { db, auth } from "../../config/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import "./UserFriends.css";

const UserFriends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

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
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
                            <span>{friend.username}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserFriends;