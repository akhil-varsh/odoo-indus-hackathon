import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Sign Up</h1>
        <p className="text-gray-500 mb-4">Create your account</p>
        <div className="space-y-3">
          <input className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="First Name" />
          <input className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Last Name" />
          <input className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Email" />
          <input type="password" className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Password" />
          <input type="password" className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Confirm Password" />
        </div>
        <button className="mt-4 w-full rounded-md bg-green-600 text-white px-3 py-2">Sign up</button>
        <p className="mt-3 text-sm text-gray-500">Already registered? <Link href="/login" className="text-blue-600 underline">Login</Link></p>
      </div>
    </div>
  );
}
