import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import "./Admin.css";

const Admin = () => {
    const [collections, setCollections] = useState({});
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = {};
            
            const collectionsSnapshot = await getDocs(collection(db, "Users"));
            const supportMessagesSnapshot = await getDocs(collection(db, "SupportMessages"));
            const conversationsSnapshot = await getDocs(collection(db, "Conversations"));
            
            data.Users = [];
            collectionsSnapshot.forEach((doc) => {
                data.Users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            data.SupportMessages = [];
            supportMessagesSnapshot.forEach((doc) => {
                data.SupportMessages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            data.Conversations = [];
            conversationsSnapshot.forEach((doc) => {
                data.Conversations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setCollections(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load database data");
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const handleDeleteDocument = async (documentId) => {
        if (!selectedCollection) return;

        try {
            // Delete the document from Firestore
            await deleteDoc(doc(db, selectedCollection, documentId));

            // Remove the document from local state
            setCollections(prevCollections => ({
                ...prevCollections,
                [selectedCollection]: prevCollections[selectedCollection].filter(
                    item => item.id !== documentId
                )
            }));

            alert(`Document ${documentId} deleted successfully`);
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete document");
        }
    };

    const renderData = (data, level = 0) => {
        if (typeof data !== 'object' || data === null) {
            return <span className="data-value">{String(data)}</span>;
        }

        return (
            <div className={`indent-level-${level}`}>
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="data-row">
                        <span className="data-key">{key}:</span>
                        {Array.isArray(value) ? (
                            <div className="array-container">
                                {value.map((item, index) => (
                                    <div key={index} className="array-item">
                                        {renderData(item, level + 1)}
                                    </div>
                                ))}
                            </div>
                        ) : typeof value === 'object' ? (
                            renderData(value, level + 1)
                        ) : (
                            <span className="data-value">{String(value)}</span>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div className="header-content">
                    <button className="back-button" onClick={handleBack}>
                        Back to Home
                    </button>
                    <h1 className="admin-title">Admin Dashboard</h1>
                </div>
            </div>
            
            {loading ? (
                <div className="loading-container">
                    <p>Loading database...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="admin-content">
                    <div className="content-wrapper">
                        <div className="sidebar">
                            <h2 className="sidebar-title">Collections</h2>
                            <div className="collections-list">
                                {Object.keys(collections).map((collectionName) => (
                                    <button
                                        key={collectionName}
                                        className={`collection-button ${
                                            selectedCollection === collectionName ? 'selected' : ''
                                        }`}
                                        onClick={() => setSelectedCollection(collectionName)}
                                    >
                                        {collectionName}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="main-content">
                            <div className="data-panel">
                                {selectedCollection ? (
                                    <>
                                        <h2 className="panel-title">
                                            {selectedCollection} Collection
                                        </h2>
                                        <div className="data-scroll-container">
                                            {collections[selectedCollection].map((item) => (
                                                <div key={item.id} className="document-item">
                                                    <div className="document-data">
                                                        {renderData(item)}
                                                    </div>
                                                    <button 
                                                        className="delete-button"
                                                        onClick={() => handleDeleteDocument(item.id)}
                                                    >
                                                        Delete Document
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        Select a collection to view its data
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;