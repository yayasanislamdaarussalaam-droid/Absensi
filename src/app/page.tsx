"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Scanner } from "@/components/Scanner";
import { Camera } from "@/components/Camera";
import { LogOut, Clock, CheckCircle2, MapPin, ClipboardX, Camera as CameraIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Home() {
  const { data: session, status } = useSession();
  const [activeView, setActiveView] = useState<"HOME" | "SCAN" | "SELFIE" | "IZIN">("HOME");
  const [isCapturingIzin, setIsCapturingIzin] = useState(false);
  const [izinType, setIzinType] = useState<"LEAVE" | "FIELD_WORK">("LEAVE");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<{ message: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<any>(null);

  useEffect(() => {
    if (session) fetchAttendance();
  }, [session]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/today");
      if (res.ok) {
        const data = await res.json();
        setAttendanceToday(Object.keys(data).length > 0 ? data : null);
      }
    } catch (err) {
      console.error("Failed to fetch attendance");
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData: decodedText }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ message: data.message, type: "SUCCESS" });
        fetchAttendance();
        setActiveView("HOME");
      } else {
        setResult({ message: data.message, type: "ERROR" });
      }
    } catch (err) {
      setResult({ message: "Gagal memproses QR", type: "ERROR" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelfieCapture = async (base64: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ message: data.message, type: "SUCCESS" });
        fetchAttendance();
        setActiveView("HOME");
      } else {
        setResult({ message: data.message, type: "ERROR" });
      }
    } catch (err) {
      setResult({ message: "Gagal mengirim selfie", type: "ERROR" });
    } finally {
      setLoading(false);
    }
  };

  const handleIzinSubmit = async (base64: string) => {
    if (!reason) {
      alert("Alasan harus diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: izinType, reason, photo: base64 }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ message: data.message, type: "SUCCESS" });
        fetchAttendance();
        setIsCapturingIzin(false);
        setActiveView("HOME");
        setReason("");
      } else {
        setResult({ message: data.message, type: "ERROR" });
      }
    } catch (err) {
      setResult({ message: "Gagal kirim izin", type: "ERROR" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-indigo-600">Absensi<span className="text-slate-900">QR</span></h1>
        <button onClick={() => signOut()} className="p-2.5 bg-slate-100 text-slate-500 rounded-full hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut size={18} />
        </button>
      </header>

      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="w-full max-w-md space-y-6">
          {/* Welcome Card */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                {session?.user?.name?.substring(0, 1)}
              </div>
              <div>
                <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Halo, Selamat Bekerja</p>
                <p className="text-lg font-black text-slate-900 leading-tight">{session?.user?.name}</p>
              </div>
            </div>
          </div>

          {/* Status View */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
             <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800">Aktivitas Hari Ini</h2>
                <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase">
                  {format(new Date(), "EEEE, d MMM", { locale: id })}
                </span>
             </div>

             {attendanceToday?.status === "LEAVE" || attendanceToday?.status === "FIELD_WORK" ? (
               <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                    <Info size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-indigo-600 uppercase">Status Khusus</p>
                    <p className="text-sm font-bold text-slate-900">
                      {attendanceToday.status === "LEAVE" ? "Izin Gak Masuk" : "Dinas Luar / Lapangan"}
                    </p>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-600 font-black uppercase mb-1">Masuk Kantor</p>
                  <p className="text-lg font-black text-slate-900">{attendanceToday?.clockIn ? format(new Date(attendanceToday.clockIn), "HH:mm") : "--:--"}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[10px] text-orange-600 font-black uppercase mb-1">Pulang Kerja</p>
                  <p className="text-lg font-black text-slate-900">{attendanceToday?.clockOut ? format(new Date(attendanceToday.clockOut), "HH:mm") : "--:--"}</p>
                </div>
               </div>
             )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            {activeView === "HOME" && !result && (
              <>
                {!attendanceToday && (
                  <>
                    <button onClick={() => setActiveView("SCAN")} className="bg-indigo-600 text-white p-6 rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                      Scan QR Masuk
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setIzinType("LEAVE"); setActiveView("IZIN"); }} className="bg-white text-slate-600 p-4 rounded-2xl font-bold border border-slate-200 flex flex-col items-center gap-2">
                        <ClipboardX className="text-red-500" /> Izin / Sakit
                      </button>
                      <button onClick={() => { setIzinType("FIELD_WORK"); setActiveView("IZIN"); }} className="bg-white text-slate-600 p-4 rounded-2xl font-bold border border-slate-200 flex flex-col items-center gap-2">
                        <MapPin className="text-indigo-500" /> Lapangan
                      </button>
                    </div>
                  </>
                )}
                {attendanceToday && !attendanceToday.clockOut && attendanceToday.status === "PRESENT" && (
                  <button onClick={() => setActiveView("SELFIE")} className="bg-orange-500 text-white p-6 rounded-[1.5rem] font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center gap-3">
                    Selfie Pulang Kerja
                  </button>
                )}
                {attendanceToday?.clockOut && (
                  <div className="bg-white p-8 rounded-[2rem] text-center border border-slate-200">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                    <p className="font-black text-slate-900">Absensi Selesai!</p>
                    <p className="text-sm text-slate-500">Selamat beristirahat bro!</p>
                  </div>
                )}
              </>
            )}

            {activeView === "SCAN" && (
              <div className="space-y-4">
                <div className="bg-white p-2 rounded-[2rem] shadow-xl border-4 border-indigo-100 overflow-hidden">
                   <Scanner onScanSuccess={handleScanSuccess} />
                </div>
                <button onClick={() => setActiveView("HOME")} className="w-full py-4 text-slate-500 font-bold">Batal Scan</button>
              </div>
            )}

            {activeView === "SELFIE" && (
               <Camera onCapture={handleSelfieCapture} onCancel={() => setActiveView("HOME")} />
            )}

            {isCapturingIzin && (
               <Camera onCapture={handleIzinSubmit} onCancel={() => setIsCapturingIzin(false)} />
            )}

            {activeView === "IZIN" && !isCapturingIzin && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white space-y-6">
                 <h2 className="text-xl font-black text-slate-900">{izinType === "LEAVE" ? "Izin / Sakit" : "Dinas Lapangan"}</h2>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Keterangan / Alasan</label>
                    <textarea 
                      className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-0 ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-slate-700"
                      placeholder="Tulis alasan singkat..."
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                 </div>
                 <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                      <CameraIcon size={32} />
                    </div>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Ambil Foto Bukti</p>
                    <button onClick={() => {
                      if (!reason) return alert("Isi alasan dulu bro");
                      setIsCapturingIzin(true);
                    }} className="w-full bg-white py-4 rounded-xl text-sm font-black text-indigo-600 shadow-sm active:scale-95 transition-all">Buka Kamera</button>
                 </div>
                 <button onClick={() => setActiveView("HOME")} className="w-full py-2 text-slate-400 text-sm font-bold uppercase tracking-widest">Batal</button>
              </div>
            )}

            {result && (
              <div className={`p-8 rounded-[2rem] text-center shadow-2xl ${result.type === "ERROR" ? "bg-red-50 border-2 border-red-100" : "bg-indigo-50 border-2 border-indigo-100"}`}>
                <p className="font-black text-slate-900 mb-4 tracking-tight leading-relaxed">{result.message}</p>
                <button onClick={() => { setResult(null); setActiveView("HOME"); }} className="bg-white px-10 py-3 rounded-xl text-sm font-black shadow-sm uppercase tracking-widest">Tutup</button>
              </div>
            )}
          </div>

          {/* Admin Link */}
          {(session?.user as any)?.role === "ADMIN" && activeView === "HOME" && (
            <div className="pt-8 text-center">
              <a href="/admin" className="inline-block bg-white border border-slate-200 px-8 py-3 rounded-full text-indigo-600 font-black text-xs hover:shadow-lg transition-all uppercase tracking-widest">Buka Panel Admin &rarr;</a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
