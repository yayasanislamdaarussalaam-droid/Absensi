"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <span className="text-white text-2xl font-black">A+</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-black leading-9 tracking-tight text-slate-900">
          Buat Akun Baru
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Daftarkan diri lu untuk mulai absensi digital
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-8 py-10 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-white">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Nama Lengkap
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  className="block w-full rounded-2xl border-0 py-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-5 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Email Address
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  placeholder="budi@company.com"
                  className="block w-full rounded-2xl border-0 py-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-5 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Password
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  placeholder="Min. 8 karakter"
                  className="block w-full rounded-2xl border-0 py-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-5 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-2xl bg-indigo-600 px-4 py-4 text-sm font-black leading-6 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? "Mendaftarkan..." : "Daftar Akun"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-black text-indigo-600 hover:text-indigo-500"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
