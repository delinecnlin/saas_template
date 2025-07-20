import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import useSWR from 'swr';

import Content from '@/components/Content/index';
import Header from '@/components/Header/index';
import Sidebar from '@/components/Sidebar/index';
import menuConfig from '@/config/menu/index';
import { useWorkspace } from '@/providers/workspace';

const AccountLayout = ({ children }) => {
  const { status } = useSession();
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { data: permissions, isLoading } = useSWR('/api/user/permissions');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router]);

  const getMenu = () => {
    if (isLoading || !permissions) {
      return [];
    }

    const menu = menuConfig(workspace?.slug);

    // Filter workspace menu based on permissions
    const workspaceMenu = menu.find(item => item.name === 'Workspace');
    if (workspaceMenu) {
      workspaceMenu.menuItems = workspaceMenu.menuItems.filter(item => {
        if (item.name === '数字人') {
          return permissions.hasAvatarFeature;
        }
        return true;
      });
    }
    
    return menu;
  };

  if (status === 'loading') return <></>;
  return (
    <main className="relative flex flex-col w-screen h-screen space-x-0 text-gray-800 dark:text-gray-200 md:space-x-5 md:flex-row bg-gray-50 dark:bg-gray-800">
      <Sidebar menu={getMenu()} />
      <Content>
        <Toaster position="bottom-left" toastOptions={{ duration: 10000 }} />
        <Header />
        {children}
      </Content>
    </main>
  );
};

export default AccountLayout;
