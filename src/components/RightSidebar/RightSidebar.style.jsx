const rightSidebarStyle = (
  <style jsx>{`
    .right-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 0;
      height: 100%;
      background-color: #f8f8f8;
      z-index: 100;
      transition: width 0.3s ease;
      overflow: hidden;
      box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    }
    .right-sidebar.dark {
      background-color: #252526;
      color: #f0f0f0;
    }
    .right-sidebar.visible {
      width: 100%;
    }
    .right-sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      height: 60px;
    }
    .right-sidebar.dark .right-sidebar-header {
      border-bottom: 1px solid #3e3e42;
    }
    .right-sidebar-title {
      font-weight: bold;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
    }
    .right-sidebar-icon {
      margin-right: 0.75rem;
    }
    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      color: #666;
    }
    .right-sidebar.dark .close-button {
      color: #999;
    }
    .right-sidebar-content {
      height: calc(100% - 60px);
      width: 100%;
      overflow: auto;
      padding: 1rem;
    }
    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
    }
    .placeholder-content p {
      margin-bottom: 2rem;
      font-size: 1.2rem;
      color: #666;
    }
    .right-sidebar.dark .placeholder-content p {
      color: #aaa;
    }
    .visualization-placeholder {
      width: 80%;
      height: 300px;
      background-color: #fff;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
    }
    .right-sidebar.dark .visualization-placeholder {
      background-color: #333;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    .placeholder-bar {
      width: 15%;
      background-color: #4caf50;
      border-radius: 4px 4px 0 0;
    }
    /* 왼쪽 토글 버튼 (RightSidebar) */
    .toggle-button-left {
      position: absolute;
      left: 0px;
      top: 340px;
      width: 25px;
      height: 60px;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      border-radius: 0 10px 10px 0;
      background-color: #f8f8f8;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .right-sidebar.dark .toggle-button-left {
      background-color: #3e3e42;
    }
    .toggle-button-left img {
      width: 24px;
      height: 24px;
    }
  `}</style>
);

export default rightSidebarStyle;
