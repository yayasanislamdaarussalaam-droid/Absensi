"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Users, QrCode, ClipboardList, Download } from "lucide-react";

export default function AdminPage() {
  const { data: session } = useSession();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [qrCodeData, setQrCodeData] = useState("");
  const [qrSecret, setQrSecret] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");

  useEffect(() => {
    fetchAttendances();
    fetchConfig();
  }, []);

  const fetchAttendances = async () => {
    try {
      const res = await fetch("/api/admin/attendance");
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
      }
    } catch (err) {
      console.error("Failed to fetch attendances");
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        setQrSecret(data.qrSecret);
        generateQrCode(data.qrSecret);
      }
    } catch (err) {
      console.error("Failed to fetch config");
    }
  };

  const generateQrCode = async (text: string) => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 400,
        margin: 2,
        color: {
          dark: "#4f46e5",
          light: "#ffffff",
        },
      });
      setQrCodeData(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tight text-indigo-600">Admin<span className="text-slate-900">Hub</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "attendance" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ClipboardList size={20} />
            Data Absensi
          </button>
          <button
            onClick={() => setActiveTab("qrcode")}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "qrcode" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <QrCode size={20} />
            QR Code Kantor
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {activeTab === "attendance" ? "Monitoring Real-time" : "Setup QR Kantor"}
          </h2>
          <div className="flex items-center gap-4">
             <a href="/" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-6 py-2 rounded-full transition-all">Dashboard</a>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "attendance" ? (
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                      <th className="px-8 py-6">Karyawan</th>
                      <th className="px-8 py-6">Tanggal</th>
                      <th className="px-8 py-6 text-emerald-600">Masuk</th>
                      <th className="px-8 py-6 text-orange-600">Pulang</th>
                      <th className="px-8 py-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendances.length > 0 ? (
                      attendances.map((att) => (
                        <tr key={att.id} className="text-sm hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                                {att.user.name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900">{att.user.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-slate-500 font-medium">
                            {format(new Date(att.date), "dd MMM yyyy", { locale: id })}
                          </td>
                          <td className="px-8 py-5 text-emerald-600 font-black">
                            {format(new Date(att.clockIn), "HH:mm")}
                          </td>
                          <td className="px-8 py-5 text-orange-600 font-black">
                            {att.clockOut ? format(new Date(att.clockOut), "HH:mm") : "--:--"}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              att.clockOut 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {att.clockOut ? "Selesai" : "Aktif"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold italic">
                          Belum ada aktivitas absensi hari ini...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto text-center space-y-10">
              <div className="bg-white p-16 rounded-[3rem] shadow-2xl shadow-slate-200 border border-white inline-block">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">QR Code Kantor</h3>
                  <p className="text-slate-400 text-sm font-medium">
                    Karyawan scan kode ini untuk verifikasi kehadiran.
                  </p>
                </div>
                
                {qrCodeData ? (
                  <div className="space-y-8 animate-in zoom-in duration-500">
                    <div className="p-4 bg-slate-50 rounded-[2rem] inline-block border-4 border-slate-100">
                      <img src={qrCodeData} alt="Office QR Code" className="w-64 h-64 rounded-xl shadow-inner" />
                    </div>
                    <div>
                      <button 
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = qrCodeData;
                          link.download = "office-qr.png";
                          link.click();
                        }}
                        className="flex items-center gap-3 mx-auto bg-slate-900 text-white px-10 py-4 rounded-2xl hover:bg-indigo-600 hover:-translate-y-1 transition-all font-black text-sm shadow-xl"
                      >
                        <Download size={18} />
                        Cetak QR Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-slate-100 animate-pulse rounded-[2rem] mx-auto flex items-center justify-center text-slate-300">
                    Sabar ya...
                  </div>
                )}
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-left max-w-xl mx-auto">
                <h4 className="text-indigo-600 font-black flex items-center gap-2 mb-3 uppercase tracking-widest text-xs">
                  Pro Tips 💡
                </h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Pasang QR Code ini di tempat yang dapet cahaya bagus biar gampang di-scan HP karyawan. Lu bisa ganti token secret-nya kapan aja di database kalo ngerasa ada yang curang.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
