import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Mypage.css';

const MyPageLayout = ({nickname}) => {
    return (
        <div className="mypage-wrapper">
            <div className="mypage">
                <Sidebar nickname={nickname} />
                <Outlet />
            </div>
        </div>
    );
};

export default MyPageLayout;
