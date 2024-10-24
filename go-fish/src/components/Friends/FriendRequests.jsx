import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, query, where, setDoc, doc, deleteDoc } from "firebase/firestore";
import './FriendRequests.css'; // Import any necessary CSS

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB46N4Kl3URAID2WJPMLnFHpZAVSxXjaKk",
  authDomain: "go-fish-b5da8.firebaseapp.com",
  projectId: "go-fish-b5da8",
  storageBucket: "go-fish-b5da8.appspot.com",
  messagingSenderId: "778081614040",
  appId: "1:778081614040:web:84fe9bb7215ea008db3fad",
  measurementId: "G-DBGHQRETSQ"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const FriendRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = "userB"; // Example user ID (to be replaced with actual user logic)

  // Function to fetch friend requests
  const fetchFriendRequests = async (userId) => {
    setLoading(true);
    try {
      const requestsRef = collection(db, "friendRequests");
      const q = query(requestsRef, where("toUserId", "==", userId));
      const querySnapshot = await getDocs(q);

      let requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      setRequests(requests);
    } catch (error) {
      console.error("Error fetching friend requests: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to accept friend request
  const acceptFriendRequest = async (requestId, fromUserId, toUserId) => {
    try {
      const friendRef = doc(db, "friends", `${fromUserId}_${toUserId}`);

      // Set the friend document
      await setDoc(friendRef, {
        userId1: fromUserId,
        userId2: toUserId,
      });

      // Delete the friend request
      await deleteDoc(doc(db, "friendRequests", requestId));

      // Update the UI after accepting the request
      setRequests(requests.filter((req) => req.id !== requestId));
      console.log("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request: ", error);
    }
  };

  // Use effect to fetch requests when component mounts
  useEffect(() => {
    fetchFriendRequests(userId);
  }, [userId]);

  return (
    <div className="friend-requests-container">
      <h2>Friend Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="requests-list">
          {requests.length > 0 ? (
            requests.map((req) => (
              <div key={req.id} className="request-item">
                <p>From: {req.fromUserId}</p>
                <button
                  className="accept-request-btn"
                  onClick={() => acceptFriendRequest(req.id, req.fromUserId, req.toUserId)}
                >
                  Accept
                </button>
              </div>
            ))
          ) : (
            <p>No friend requests</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;
