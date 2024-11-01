import React, { useState } from 'react';
import './App.css'; // Ensure you have this CSS file for styling

const App = () => {
    const [currentStep, setCurrentStep] = useState(0);
    
    const steps = [
        "Each player is dealt 5 cards.", 
        "Place remaining cards in the middle of the table.",
        "Player to the left of the dealer starts.",
        "Player asks any other player if they have cards of a certain rank (Aces, twos, threes, etc.).",
        "If the player being asked has the cards, they must hand them to the person asking.",
        "Otherwise, the player says 'Go Fish!'",
        "If the current player gets cards from someone, they can go again"
    ];
    
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="tutorial-container">
            <h2>Tutorial</h2>
            <p className="tutorial-step">{steps[currentStep]}</p>
            
            <div className="tutorial-controls">
                <button onClick={handlePrevious} disabled={currentStep === 0} className="control-button">Previous</button>
                <button onClick={handleNext} disabled={currentStep === steps.length - 1} className="control-button">Next</button>
            </div>
        </div>
    );
};

export default App;
