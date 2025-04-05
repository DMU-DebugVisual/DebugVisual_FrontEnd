const mainStyle = (
  <style jsx>{`
    .main-editor {
      height: 100%;
      width: 100%;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .main-editor.dark {
      color: #e0e0e0;
      background-color: #1e1e1e;
    }
    .editor-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      position: relative;
    }
    .menu-button {
      font-size: 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
      margin-right: 1rem;
    }
    .editor-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: inherit;
      flex: 1;
    }
    /* 수정된 오른쪽 토글 버튼 (Main)
       - 직사각형 모양, 메인 영역 오른쪽에 딱 붙고,
       - 화살표(이미지)가 있는 쪽(왼쪽 모서리)만 둥글게 처리 */
    .right-sidebar-toggle {
      position: absolute;
      right: -15px;
      top: 270px; /* 위치는 필요에 따라 조정 */
      width: 25px;
      height: 60px;
      background-color: #f8f8f8;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      border-radius: 10px 0 0 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .main-editor.dark .right-sidebar-toggle {
      background-color: #3e3e42;
    }
    .right-sidebar-toggle img {
      width: 24px;
      height: 24px;
    }
    .editor-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }
    .code-editor {
      width: 100%;
      height: 100%;
      border: none;
      padding: 1rem;
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 1rem;
      resize: none;
      background-color: #f5f5f5;
      color: inherit;
      border-radius: 8px;
      line-height: 1.5;
      min-height: 300px;
    }
    .main-editor.dark .code-editor {
      background-color: #1e1e1e;
      color: #d4d4d4;
    }
    .run-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background-color: #4caf50;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s, background-color 0.2s;
      transform: scale(1);
    }
    .run-button:hover {
      background-color: #45a049;
      transform: scale(1.05);
    }
  `}</style>
);

export default mainStyle;
