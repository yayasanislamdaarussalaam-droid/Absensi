"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Scanner } from "@/components/Scanner";
import { LogOut, User, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Home() {
  const { data: session, status } = useSession();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ message: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<any>(null);

  useEffect(() => {
    if (session) {
      fetchAttendance();
    }
  }, [session]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/today");
      if (res.ok) {
        const data = await res.json();
        setAttendanceToday(data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance");
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (loading) return;
    setLoading(true);
    setIsScanning(false);

    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData: decodedText }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ message: data.message, type: data.type });
        fetchAttendance();
      } else {
        setResult({ message: data.message, type: "ERROR" });
      }
    } catch (err) {
      setResult({ message: "Gagal memproses absensi", type: "ERROR" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-indigo-600">Absensi<span className="text-slate-900">QR</span></h1>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{session?.user?.name}</p>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{(session?.user as any)?.role}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2.5 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          {/* Status Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800 text-lg">Status Kehadiran</h2>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                {format(new Date(), "EEEE, d MMM", { locale: id })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-2">Check In</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Clock size={14} className="text-emerald-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">
                    {attendanceToday?.clockIn 
                      ? format(new Date(attendanceToday.clockIn), "HH:mm")
                      : "--:--"
                    }
                  </p>
                </div>
              </div>
              <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100/50">
                <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-2">Check Out</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock size={14} className="text-orange-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">
                    {attendanceToday?.clockOut
                      ? format(new Date(attendanceToday.clockOut), "HH:mm")
                      : "--:--"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="text-center space-y-6">
            {!isScanning && !result && (
              <button
                onClick={() => setIsScanning(true)}
                className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                Scan QR Sekarang
              </button>
            )}

            {isScanning && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="p-2 bg-white rounded-[2rem] shadow-2xl border-4 border-indigo-100">
                  <Scanner onScanSuccess={handleScanSuccess} />
                </div>
                <button
                  onClick={() => setIsScanning(false)}
                  className="bg-white text-slate-500 font-bold py-3 px-8 shadow-sm hover:bg-slate-50 rounded-2xl transition-all border border-slate-200"
                >
                  Batal Scan
                </button>
              </div>
            )}

            {result && (
              <div className={`p-8 rounded-[2rem] animate-in slide-in-from-bottom duration-500 ${
                result.type === "ERROR" 
                  ? "bg-red-50 border-2 border-red-100 shadow-red-100" 
                  : "bg-indigo-50 border-2 border-indigo-100 shadow-indigo-100"
              } shadow-2xl`}>
                {result.type !== "ERROR" ? (
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 size={32} className="text-indigo-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-red-600 font-black text-3xl">!</span>
                  </div>
                )}
                <h3 className={`text-xl font-black mb-1 ${result.type === "ERROR" ? "text-red-800" : "text-indigo-800"}`}>
                  {result.type === "ERROR" ? "Opps!" : "Berhasil!"}
                </h3>
                <p className={`font-medium ${result.type === "ERROR" ? "text-red-600" : "text-indigo-600"}`}>
                  {result.message}
                </p>
                <button
                  onClick={() => setResult(null)}
                  className={`mt-6 px-8 py-2 rounded-xl font-bold text-sm transition-all ${
                    result.type === "ERROR" 
                      ? "bg-red-100 text-red-700 hover:bg-red-200" 
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  }`}
                >
                  Mengerti
                </button>
              </div>
            )}
          </div>

          {/* Admin Link */}
          {(session?.user as any)?.role === "ADMIN" && (
            <div className="pt-8 text-center">
              <a 
                href="/admin" 
                className="text-indigo-600 text-sm font-semibold hover:underline"
              >
                Buka Panel Admin &rarr;
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
