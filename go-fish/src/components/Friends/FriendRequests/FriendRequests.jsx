import { useState, useEffect } from "react";
import { db, auth } from "../../config/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import "./FriendRequests.css";

const FriendRequests = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (!auth.currentUser) return;

        const requestsRef = collection(db, "FriendRequests");
        const q = query(requestsRef, 
            where("recipientId", "==", auth.currentUser.uid),
            where("status", "==", "pending")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requestsData = [];
            querySnapshot.forEach((doc) => {
                requestsData.push({ id: doc.id, ...doc.data() });
            });
            setRequests(requestsData);
        });

        return () => unsubscribe();
    }, []);

    const handleRequest = async (requestId, senderId, action) => {
        try {
            const requestRef = doc(db, "FriendRequests", requestId);
            
            if (action === "accept") {
                // Update both users' friends lists
                const currentUserRef = doc(db, "Users", auth.currentUser.uid);
                const senderRef = doc(db, "Users", senderId);
                
                await updateDoc(currentUserRef, {
                    friends: arrayUnion(senderId),
                    pendingFriendRequests: arrayRemove(senderId)
                });
                
                await updateDoc(senderRef, {
                    friends: arrayUnion(auth.currentUser.uid)
                });
                
                // Delete the friend request
                await deleteDoc(requestRef);
            } else {
                // Decline: just delete the request and remove from pending
                const currentUserRef = doc(db, "Users", auth.currentUser.uid);
                await updateDoc(currentUserRef, {
                    pendingFriendRequests: arrayRemove(senderId)
                });
                await deleteDoc(requestRef);
            }
        } catch (error) {
            console.error("Error handling friend request:", error);
        }
    };

    return (
        <div className="friend-requests">
            <h2>Friend Requests</h2>
            {requests.length === 0 ? (
                <p className="no-requests">No pending friend requests</p>
            ) : (
                <div className="requests-list">
                    {requests.map((request) => (
                        <div key={request.id} className="request-item">
                            <span>{request.senderUsername} wants to be your friend</span>
                            <div className="request-buttons">
                                <button
                                    onClick={() => handleRequest(request.id, request.senderId, "accept")}
                                    className="accept-button"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleRequest(request.id, request.senderId, "decline")}
                                    className="decline-button"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendRequests;