import React from 'react';
import './CodecastLive.css';

import Header from './CodecastHeader';
import Sidebar from './CodecastSidebar';
import CodeEditor from './CodeEditor';
import CodePreviewList from './CodePreviewList';

const CodeBroadcastPage = () => {
    return (
        <div className="broadcast-wrapper">
            <Header />
            <div className="main-section">
                <Sidebar />
                <CodeEditor />
            </div>
            <CodePreviewList />
        </div>
    );
};

export default CodeBroadcastPage;
