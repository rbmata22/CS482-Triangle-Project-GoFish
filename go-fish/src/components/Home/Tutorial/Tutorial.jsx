import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GiCardPickup, GiCardAceHearts, GiCard2Clubs, GiCard3Spades, GiAnglerFish } from 'react-icons/gi';
import { IoTabletLandscape, IoPersonOutline } from 'react-icons/io5';
import { FaArrowRotateLeft } from 'react-icons/fa6';
import './Tutorial.css';

const App = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    const steps = [
        {
            text: "Each player is dealt 5 cards.",
            icon: <GiCardPickup className="icon" />,
        },
        {
            text: "Place remaining cards in the middle of the table.",
            icon: <IoTabletLandscape className="icon" />,
        },
        {
            text: "Player asks any other player if they have cards of a certain rank (Aces, twos, threes, etc.).",
            icons: [
                <GiCardAceHearts key="ace" className="icon" />,
                <GiCard2Clubs key="two" className="icon" />,
                <GiCard3Spades key="three" className="icon" />,
            ],
        },
        {
            text: "If the player being asked has the cards, they must hand them to the person asking.",
            icons: [
                <IoPersonOutline key="person" className="icon" />,
                <GiCardAceHearts key="ace" className="icon" />,
            ],
        },
        {
            text: "If they don’t have the rank, they say 'Go Fish!' The player then draws from the fish pile.",
            icon: <GiAnglerFish className="icon" />,
        },
        {
            text: "If the drawing player completes a set of 4 cards of the same rank, they place the set face down as a 'book'.",
        },
        {
            text: "Players continue asking and fishing. If a player gets the requested cards, they go again.",
            icon: <FaArrowRotateLeft className="icon" />,
        },
        {
            text: "The game ends when all sets have been created, or the fish pile is empty.",
        },
        {
            text: "The player with the most sets (books) wins the game!",
            icon: <IoPersonOutline className="icon" />,
        },
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

    const handleBackToHome = () => {
        navigate('/home');
    };

    return (
        <div className="tutorial-container">
            <h2 className="tutorial-title">Game Tutorial</h2>
            <div className="tutorial-content">
                <div className="step-icon">
                    {steps[currentStep].icons 
                        ? steps[currentStep].icons.map((icon, index) => (
                            <span key={index}>{icon}</span>
                          ))
                        : steps[currentStep].icon}
                </div>
                <p className="tutorial-step">{steps[currentStep].text}</p>
            </div>

            <div className="tutorial-controls">
                <button onClick={handlePrevious} disabled={currentStep === 0} className="control-button">
                    Previous
                </button>
                <button onClick={handleNext} disabled={currentStep === steps.length - 1} className="control-button">
                    Next 
                </button>
            </div>

            <button onClick={handleBackToHome} className="back-button">
                Back to Home
            </button>
        </div>
    );
};

export default App;
