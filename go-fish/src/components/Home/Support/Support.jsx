import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { Check } from "lucide-react";
import "./Support.css";

const Support = ({ onClose }) => {
    const [message, setMessage] = useState("");
    const [showNotification, setShowNotification] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            const userId = auth.currentUser ? auth.currentUser.uid : "guest";
            await addDoc(collection(db, "SupportMessages"), {
                userId,
                message,
                timestamp: new Date()
            });
            setMessage("");
            setShowNotification(true);
            
            // Auto hide notification and close form after 2 seconds
            setTimeout(() => {
                setShowNotification(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    return (
        <div className="relative">
            {showNotification && (
                alert("Thank you for submitting a support message! An admin will begin working on your message shortly :)")
            )}

            <div className="support-popup">
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What do you need help with?"
                    />
                    <div className="button-group">
                        <button type="submit">Send</button>
                        <button type="button" onClick={onClose}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Support;
