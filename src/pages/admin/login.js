import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user?.isAdmin) {
      router.replace('/admin');
    }
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await signIn('admin', {
      username,
      password,
      callbackUrl: '/admin',
      redirect: false,
    });

    if (result?.error) {
      toast.error('Invalid credentials');
      setError('Invalid credentials');
    } else if (result?.url) {
      router.replace(result.url);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 space-y-3">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col w-64 space-y-3">
        <input
          className="p-2 border rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (error) setError('');
          }}
        />
        <input
          className="p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
        />
        <button className="p-2 text-white bg-blue-600 rounded">Login</button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
}
