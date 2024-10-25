import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import "./Support.css";

const Support = ({ onClose }) => {
    const [message, setMessage] = useState("");

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
            onClose();
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    return (
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
    );
};

export default Support;
