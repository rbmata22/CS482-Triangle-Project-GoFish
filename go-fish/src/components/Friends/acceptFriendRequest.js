import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB46N4Kl3URAID2WJPMLnFHpZAVSxXjaKk",
  authDomain: "go-fish-b5da8.firebaseapp.com",
  projectId: "go-fish-b5da8",
  storageBucket: "go-fish-b5da8.appspot.com",
  messagingSenderId: "778081614040",
  appId: "1:778081614040:web:84fe9bb7215ea008db3fad",
  measurementId: "G-DBGHQRETSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

function fetchFriendRequests(userId) {
  const requestsRef = collection(db, "friendRequests");
  const q = query(requestsRef, where("toUserId", "==", userId));
  const querySnapshot = await getDocs(q);

  let requests = [];
  querySnapshot.forEach((doc) => {
    requests.push({ id: doc.id, ...doc.data() });
  });

  return requests;
}
function acceptFriendRequest(requestId, fromUserId, toUserId) {
  const friendRef = doc(db, "friends", `${fromUserId}_${toUserId}`);

  // Set the friend document
  await setDoc(friendRef, {
    userId1: fromUserId,
    userId2: toUserId,
    // Additional info if needed
  });

  // Delete the friend request
  await deleteDoc(doc(db, "friendRequests", requestId));
}
