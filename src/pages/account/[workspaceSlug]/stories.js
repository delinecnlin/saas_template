import { useRouter } from 'next/router';
import AccountLayout from '@/layouts/AccountLayout';

function StoriesPage() {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // TODO: integrate with real stories data
  const stories = [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">儿童故事</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          新建故事
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stories.length > 0 ? stories.map(s => (
          <div key={s.id} className="bg-white rounded shadow p-4">
            <div className="font-semibold text-lg">{s.title}</div>
            <div className="text-gray-500 text-sm mb-2">{s.content}</div>
          </div>
        )) : (
          <div className="col-span-2 text-gray-400">暂无故事</div>
        )}
      </div>
    </div>
  );
}

StoriesPage.getLayout = function getLayout(page) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default StoriesPage;
