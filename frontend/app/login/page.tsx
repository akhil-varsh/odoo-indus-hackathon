import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-gray-500 mb-4">Sign in to continue</p>
        <div className="space-y-3">
          <input className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Login" />
          <input type="password" className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Password" />
        </div>
        <button className="mt-4 w-full rounded-md bg-blue-600 text-white px-3 py-2">Login</button>
        <p className="mt-3 text-sm text-gray-500">No account? <Link href="/signup" className="text-blue-600 underline">Sign up</Link></p>
      </div>
    </div>
  );
}
