import { MessageSquarePlus, Search } from 'lucide-react';
import './AddUser.css';

const AddUser = () => {
    return (
        <div className="adduser">
            <form>
                <input type="text" placeholder='Username' name="username" />
                <button>
                    <Search />
                </button>
            </form>
            <div className='user-to-message'>
                <div className='user-detail'>
                    <span>AddMeUser</span>
                </div>
                <button>
                    <MessageSquarePlus />
                </button>
            </div>
        </div>
    );
}

export default AddUser;