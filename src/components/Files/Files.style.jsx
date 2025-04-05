const filesStyle = (
    <style jsx>{`
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
  
  export default filesStyle;
  