import { CircleUserRound } from 'lucide-react';
import './ListChats.css';
import { useEffect, useState } from 'react';

const ListChats = () => {
    const [messages, setMessages] = useState([]);

    const {currentUser} = useUserStore();

    useEffect (() => {
        const unsub = onSnapshot(doc(db, "UserMessages", currentUser.id), (doc) => {
            setMessages(doc.data());
        });

        return () => {
            unsub();
        }
    }, [currentUser.id]);

    console.log(messages);

    return (
        <div className='listchats'>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
            <div className='user'>
                <CircleUserRound />
                <div className='chats'>
                    <span>UserUser321</span>
                    <p>Hello there!</p>
                </div>
            </div>
        </div>
    );
}

export default ListChats;