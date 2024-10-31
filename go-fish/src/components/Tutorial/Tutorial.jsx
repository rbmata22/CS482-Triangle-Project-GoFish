import React, { useState } from 'react';
import './Tutorial.css';

const Tutorial = () => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        "Welcome to the tutorial! Here you'll learn how to use this app.",
        "Step 1: Open the main panel to view your files.",
        "Step 2: Select a file to start editing.",
        "Step 3: Use the sidebar options for additional actions.",
        "Congrats! You've completed the tutorial."
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
            <p>{steps[currentStep]}</p>
            <div className="tutorial-controls">
                <button onClick={handlePrevious} disabled={currentStep === 0}>Previous</button>
                <button onClick={handleNext} disabled={currentStep === steps.length - 1}>Next</button>
            </div>
        </div>
    );
};

export default Tutorial;
