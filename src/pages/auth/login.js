import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

import Meta from '@/components/Meta/index';
import { AuthLayout } from '@/layouts/index';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn('admin', {
      username: email,
      password,
      redirect: false,
      callbackUrl: '/account',
    });
    setLoading(false);
    if (result?.error) {
      toast.error('Invalid credentials');
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  const signInWithGoogle = () => signIn('google');

  return (
    <AuthLayout>
      <Meta title="NextJS SaaS Boilerplate | Login" description="A boilerplate for your NextJS SaaS projects." />
      <div className="flex flex-col items-center justify-center p-5 m-auto space-y-5 rounded shadow-lg md:p-10 md:w-1/3">
        <div>
          <Link href="/" className="text-4xl font-bold">
            Nextacular
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
        </div>
        <form onSubmit={handleCredentialsLogin} className="flex flex-col w-full space-y-3">
          <input
            className="px-3 py-2 border rounded"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="px-3 py-2 border rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="py-2 text-white bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-75" disabled={loading}>
            Login
          </button>
        </form>
        <button
          className="py-2 bg-gray-100 border rounded hover:bg-gray-50 disabled:opacity-75 w-full"
          disabled={loading}
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </button>
        <Link href="/auth/register" className="text-sm text-blue-600 hover:underline">
          Need an account? Register
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
