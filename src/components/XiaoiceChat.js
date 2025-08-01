import { useEffect } from 'react';

const XiaoiceChat = () => {
  useEffect(() => {
    const script = document.createElement('script');
    const scriptContent = `
!(function(window){
const host="https://aibeings-agent.xiaoice.com",
  url=host+'/AgentCustomer/d760954caae94d28b1d468692a3bc3ca?isPc=1&isAutoResize=1&closable=1';
const wrapDiv=document.createElement('div');
wrapDiv.id='xiaoice-agent-embed';
const container=document.createElement('div');
container.id='xiaoice-agent-container';
const stylesheet=document.createElement('style');
stylesheet.innerHTML='#xiaoice-agent-embed{z-index:9999;position:fixed;right:20px;bottom:40px;width:48px;height:48px;border-radius:50%;box-shadow:0px 8px 24px 0px rgba(0,0,0,0.12);background:url("https://aibeings-vip.oss-cn-beijing.aliyuncs.com/public/static/agent_avatar.png");background-size:cover;cursor:pointer}#xiaoice-agent-container{position:absolute;right:0;bottom:58px;border:0;border-radius:16px;box-shadow:0px 20px 20px 0px rgba(0,0,0,0.1);overflow:hidden}#xiaoice-agent-container.horizontal{height:366px;width:calc(366px*16/9)}#xiaoice-agent-container.vertical{height:680px;width:calc(680px*9/16)}#xiaoice-agent-container iframe{width:100%;height:100%;border:0}';
const iframe=document.createElement('iframe');
iframe.allowFullscreen=false;
iframe.allow='microphone';
iframe.src=url;
window.addEventListener('message',(e)=>{
  if(e.origin!==host)return;
  if(e.data.action==='close'){
    container.classList.toggle('vertical',false);
    wrapDiv.removeChild(container);
  }
});
container.appendChild(iframe);
wrapDiv.appendChild(stylesheet);
wrapDiv.addEventListener('click',()=>{
  if(container.classList.contains('vertical')){
    container.classList.toggle('vertical',false);
    wrapDiv.removeChild(container);
  }else{
    container.classList.toggle('vertical',true);
    wrapDiv.appendChild(container);
  }
});
document.body.appendChild(wrapDiv);
})(globalThis);
    `;
    script.innerHTML = scriptContent;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      const existing = document.getElementById('xiaoice-agent-embed');
      if (existing) {
        document.body.removeChild(existing);
      }
    };
  }, []);

  return null;
};

export default XiaoiceChat;
