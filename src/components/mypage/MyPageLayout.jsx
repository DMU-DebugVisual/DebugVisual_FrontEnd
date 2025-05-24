import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

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
