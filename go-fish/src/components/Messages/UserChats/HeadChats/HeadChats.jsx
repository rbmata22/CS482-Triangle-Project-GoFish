import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db, auth } from "../../../config/firebase";
import { MessageSquarePlus } from "lucide-react";
import AddUser from "../ListChats/AddUser/AddUser";
import "./HeadChats.css";

const HeadChats = ({ onNewConversation }) => {
    const [userData, setUserData] = useState({});
    const [isAddUser, setIsAddUser] = useState(false);

    // Effect hook to fetch user data when the component mounts
    useEffect(() => {
        const fetchUserData = async () => {
          const userId = auth?.currentUser?.uid; // Get the current user's ID

          // Fetching from Firestore
          if (userId) {
            const userDoc = await getDoc(doc(db, "Users", userId));
            if (userDoc.exists()) {
              setUserData(userDoc.data());
            }
          }
        };
    
        fetchUserData();
    }, []); 

    // Function to toggle the visibility of the AddUser component
    const handleAddUserClick = () => {
        setIsAddUser(prev => !prev);
    };

    return (
        <div className="headchats">
            <div className="username">
                <h6>{userData.username}</h6>
            </div>
            <div className="newmessage">
                <button onClick={handleAddUserClick}>
                    <MessageSquarePlus />
                </button>
            </div>
            {isAddUser && <AddUser onNewConversation={onNewConversation} />}
        </div>
    );
}

export default HeadChats;
