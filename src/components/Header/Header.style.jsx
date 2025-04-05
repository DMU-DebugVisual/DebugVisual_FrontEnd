const headerStyle = (
  <style jsx>{`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background-color: #f8f8f8;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      padding: 0 1rem;
      z-index: 1000;
    }
    .header.dark {
      background-color: #252526;
      border-bottom: 1px solid #3e3e42;
      color: #f0f0f0;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .main-nav {
      flex: 1;
      display: flex;
      justify-content: center;
      margin: 0 1rem;
    }
    .menu-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .menu-item {
      margin: 0 1rem;
    }
    .menu-button {
      background: none;
      border: none;
      font-size: 1rem;
      padding: 0.5rem;
      cursor: pointer;
      position: relative;
    }
    .menu-button.active {
      color: #4caf50;
    }
    .active-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 70%;
      height: 3px;
      background-color: #4caf50;
      border-radius: 2px;
    }
    .user-profile {
      display: flex;
      align-items: center;
    }
    .profile-button {
      background: none;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .header:not(.dark) .profile-button {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .header.dark .profile-button {
      background-color: rgba(255, 255, 255, 0.1);
    }
    /* 헤더와 겹치지 않도록 본문에 여백을 추가 */
    .header-placeholder {
      height: 60px;
    }
  `}</style>
);

export default headerStyle;
