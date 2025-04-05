const authPanelStyle = (
    <style jsx>{`
      .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid #e0e0e0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .sidebar.dark .sidebar-footer {
        border-top: 1px solid #3e3e42;
      }
      .auth-button {
        padding: 0.6rem 1rem;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .auth-button.login {
        background-color:rgb(161, 68, 195);
        color: white;
      }
      .auth-button.login:hover {
        background-color: rgb(129, 53, 157);
      }
      .auth-button.signup {
        background-color: transparent;
        color: rgb(161, 68, 195);
        border: 1px solid rgb(161, 68, 195);
      }
      .auth-button.signup:hover {
        background-color: rgba(161, 68, 195, 0.2);
      }
      .sidebar.dark .auth-button.signup {
        color: rgb(207, 104, 244);
        border-color: rgb(207, 104, 244);
      }
    `}</style>
  );
  
  export default authPanelStyle;
  