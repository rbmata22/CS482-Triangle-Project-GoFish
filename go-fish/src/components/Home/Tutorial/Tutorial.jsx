import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GiCardPickup, GiCardJoker, GiCardAceHearts, GiCard2Clubs, GiCard3Spades, GiAnglerFish } from 'react-icons/gi';
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
            text: "Otherwise, the player says 'Go Fish!'",
            icon: <GiAnglerFish className="icon" />,
        },
        {
            text: "If the current player gets cards from someone, they can go again",
            icon: <FaArrowRotateLeft className="icon" />,
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
