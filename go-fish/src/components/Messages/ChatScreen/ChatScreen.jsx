import { CircleUserRound, Send } from 'lucide-react';
import './ChatScreen.css';

const ChatScreen = () => {
    return (
        <div className='chatscreen'>
            <div className='top'>
                <CircleUserRound />
                <div className='usermessage'>
                    <span>UserUser123</span>
                </div>
            </div>
            <div className='middle'>
                <div className='message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello ello skje fnsekj fnreskj fnsekj fnerskj erskj fnreworld! ello world!!! yo yo yoy o o oyo yoo yy!! yo yo yoy o o oyo yoo yy world!!!</p>
                    </div>
                </div>
                <div className='message'>
                    <div className='text'>
                        <p>i am a test ello world!!! yo yo yo sekjefsnkjfesnkj fnsekjfnerskj fneskjf neskjf neskjfner fy o o oyo yoo yy ello world!!! yo yo yoy o o oyo yoo yy message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello ello world!!! yo yo yoy o o oyo yoo yy world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!! yo yo yoy o o oyo yoo yy o yoo oyo yo oyo </p>
                    </div>
                </div>
                <div className='own-message'>
                    <div className='text'>
                        <p>i am a test message hello world!!!</p>
                    </div>
                </div>
            </div>
            <div className='bottom'>
                <div className='message-icons'></div>
                <input type="text" placeholder='Begin typing your message here...'/>
                <button className='send-button'>
                    <Send />
                </button>
            </div>
        </div>
    );
}

export default ChatScreen;