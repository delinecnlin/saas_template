import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import axios from 'axios';
import { useEffect, useState } from 'react';

const fetcher = (url) => axios.get(url).then((res) => res.data);

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data } = useSWR(session?.user?.isAdmin ? '/api/admin/users' : null, fetcher);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login');
    if (status === 'authenticated' && !session?.user?.isAdmin) router.replace('/');
  }, [status, session]);

  const [updating, setUpdating] = useState(false);
  const updateSubscription = async (email, subscriptionType) => {
    setUpdating(true);
    await axios.patch('/api/admin/subscription', { email, subscriptionType });
    setUpdating(false);
  };

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">User Subscriptions</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2">Email</th>
            <th className="border px-2">Subscription</th>
          </tr>
        </thead>
        <tbody>
          {data?.users?.map((u) => (
            <tr key={u.email} className="text-center">
              <td className="border px-2">{u.email}</td>
              <td className="border px-2">
                <select
                  className="p-1 border"
                  defaultValue={u.subscriptionType}
                  disabled={updating}
                  onChange={(e) => updateSubscription(u.email, e.target.value)}
                >
                  <option value="FREE">FREE</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
