import React from 'react';
import authPanelStyle from './AuthPanel.style';

const AuthPanel = () => {
  return (
    <div className="sidebar-footer">
      <button className="auth-button login">로그인</button>
      <button className="auth-button signup">회원가입</button>
      {authPanelStyle}
    </div>
  );
};

export default AuthPanel;
