// Friends.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './Friends.css';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchFriends = async () => {
      if (userId) {
        const friendsCollection = collection(db, 'Friends');
        const friendsSnapshot = await getDocs(friendsCollection);
        const friendsList = friendsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriends(friendsList);
      }
    };

    fetchFriends();
  }, [userId]);

  return (
    <div className="friends-container">
      <h2>Your Friends</h2>
      <ul className="friends-list">
        {friends.length > 0 ? (
          friends.map(friend => (
            <li key={friend.id} className="friend-item">
              <img src={friend.logo} alt={`${friend.username}'s logo`} className="friend-logo" />
              <span className="friend-username">{friend.username}</span>
            </li>
          ))
        ) : (
          <p>No friends found.</p>
        )}
      </ul>
    </div>
  );
};

export default Friends;
