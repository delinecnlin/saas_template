import AccountLayout from '@/layouts/AccountLayout';
import TextChat from '@/components/TextChat';

function ChatPage() {
  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4">Chat Panel</h1>
      <TextChat />
    </div>
  );
}

ChatPage.getLayout = function getLayout(page) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default ChatPage;
