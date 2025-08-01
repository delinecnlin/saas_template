import { useEffect } from 'react';

const XiaoiceChat = () => {
  useEffect(() => {
    // TODO: replace with actual Xiaoice iframe script provided by the user
    const script = document.createElement('script');
    script.src = 'XIAOICE_IFRAME_SCRIPT_URL';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div id="xiaoice-chat-container" />
    </div>
  );
};

export default XiaoiceChat;
