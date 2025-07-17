import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function AdminLogin() {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (session?.user?.isAdmin) {
      router.replace('/admin');
    }
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    await signIn('admin', {
      username,
      password,
      callbackUrl: '/admin',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 space-y-3">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col w-64 space-y-3">
        <input
          className="p-2 border rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="p-2 text-white bg-blue-600 rounded">Login</button>
      </form>
    </div>
  );
}
