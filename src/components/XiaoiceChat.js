const CHAT_URL =
  'https://aibeings-agent.xiaoice.com/AgentCustomer/d760954caae94d28b1d468692a3bc3ca?isPc=1&isAutoResize=1&closable=1';

const XiaoiceChat = () => {
  return (
    <iframe
      src={CHAT_URL}
      allow="microphone"
      allowFullScreen={false}
      className="w-full h-[680px] rounded-md border-0"
    />
  );
};

export default XiaoiceChat;
