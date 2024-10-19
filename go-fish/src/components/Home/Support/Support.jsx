import React from 'react';
import './Support.css';

const Support = ({ userInput, onInputChange, onInputSubmit, chatLog }) => {
    return (
        <div className='support-window'>
            <h4 className='support-header'>Support Window</h4>
            <div className='chat-log'>
                {chatLog.map((message, index) => (
                    <p key={index} className='chat-message'>{message}</p>
                ))}
            </div>
            <input
                className='support-input'
                type='text'
                placeholder='How may I assist you?'
                value={userInput}
                onChange={onInputChange}
                onKeyDown={onInputSubmit}
            />
        </div>
    );
}

export default Support;
