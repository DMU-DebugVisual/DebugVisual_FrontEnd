const sidebarStyle = (
  <style jsx>{`
    /* 사이드바 컨테이너 스타일 */
    .sidebar {
      width: 250px;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.3s ease;
      background-color: #f8f8f8;
      border-right: 1px solid #e0e0e0;
    }
    .sidebar.dark {
      background-color: #252526;
      border-right: 1px solid #3e3e42;
      color: #f0f0f0;
    }
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 100;
        transform: translateX(-100%);
        box-shadow: 2px 0 5px rgba(0,0,0,0.1);
      }
      .sidebar.visible {
        transform: translateX(0);
      }
    }
    /* 닫기 버튼 스타일 */
    .close-button {
      display: none;
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #666;
    }
    .sidebar.dark .close-button {
      color: #999;
    }
    @media (max-width: 768px) {
      .close-button {
        display: block;
      }
    }
    /* 헤더 및 파일 목록 스타일 */
    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sidebar.dark .sidebar-header {
      border-bottom: 1px solid #3e3e42;
    }
    .sidebar-title {
      font-weight: bold;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
    }
    .sidebar-icon {
      margin-right: 0.5rem;
    }
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    .files-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .file-item {
      margin: 0.5rem 0;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .file-item.active {
      background-color: rgba(76, 175, 80, 0.1);
    }
    .sidebar.dark .file-item.active {
      background-color: rgba(76, 175, 80, 0.2);
    }
    .file-item.hover:not(.active) {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .sidebar.dark .file-item.hover:not(.active) {
      background-color: rgba(255, 255, 255, 0.05);
    }
    .file-icon {
      margin-right: 0.5rem;
    }
  `}</style>
);

export default sidebarStyle;
