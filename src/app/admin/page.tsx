"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { format, eachMonthOfInterval, subMonths, parse } from "date-fns";
import { id } from "date-fns/locale";
import { QrCode, ClipboardList, Download, Trash2, Eye, X, Calendar, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminPage() {
  const { data: session } = useSession();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [qrCodeData, setQrCodeData] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 11),
    end: new Date(),
  }).reverse();

  useEffect(() => {
    fetchAttendances();
    fetchConfig();
  }, []);

  useEffect(() => {
    const filtered = attendances.filter(att => 
      format(new Date(att.date), "yyyy-MM") === selectedMonth
    );
    setFilteredData(filtered);
  }, [selectedMonth, attendances]);

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

  const deleteRecord = async (id: string) => {
    if (!confirm("Yakin mau hapus data ini?")) return;
    try {
      const res = await fetch("/api/admin/attendance/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchAttendances();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  const deleteMonth = async () => {
    const monthLabel = format(parse(selectedMonth, "yyyy-MM", new Date()), "MMMM yyyy", { locale: id });
    if (!confirm(`PERINGATAN! Ini akan menghapus SELURUH data absensi di bulan ${monthLabel}. Lanjutkan?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/attendance/delete-month", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });
      if (res.ok) {
        alert("Satu bulan berhasil dibersihkan!");
        fetchAttendances();
      }
    } catch (err) {
      alert("Gagal menghapus data bulanan");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return alert("Gak ada data buat di-export bro");
    
    const dataToExport = filteredData.map(att => ({
      Nama: att.user.name,
      Tanggal: format(new Date(att.date), "dd/MM/yyyy"),
      Status: att.status === "PRESENT" ? "Hadir" : att.status === "LEAVE" ? "Izin" : "Lapangan",
      "Jam Masuk": att.clockIn ? format(new Date(att.clockIn), "HH:mm") : "-",
      "Jam Pulang": att.clockOut ? format(new Date(att.clockOut), "HH:mm") : "-",
      Keterangan: att.reason || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");
    XLSX.writeFile(workbook, `Laporan_Absensi_${selectedMonth}.xlsx`);
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
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
        color: { dark: "#4f46e5", light: "#ffffff" },
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
          <button onClick={() => setActiveTab("attendance")} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === "attendance" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}>
            <ClipboardList size={20} /> Data Absensi
          </button>
          <button onClick={() => setActiveTab("qrcode")} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === "qrcode" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}>
            <QrCode size={20} /> QR Code Kantor
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Management Panel</h2>
          <a href="/" className="text-sm font-bold text-indigo-600 bg-indigo-50 px-6 py-2 rounded-full">Dashboard</a>
        </header>

        <div className="p-8">
          {activeTab === "attendance" ? (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <Calendar className="text-slate-400" size={20} />
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 outline-none pr-4"
                  >
                    {months.map(m => (
                      <option key={format(m, "yyyy-MM")} value={format(m, "yyyy-MM")}>
                        {format(m, "MMMM yyyy", { locale: id })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    <FileSpreadsheet size={18} /> Export Excel
                  </button>
                  <button 
                    onClick={deleteMonth}
                    disabled={loading}
                    className="flex items-center gap-2 bg-white text-red-500 border border-red-100 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={18} /> Bersihkan Bulan Ini
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                        <th className="px-8 py-6">Karyawan</th>
                        <th className="px-8 py-6">Tanggal</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6 text-emerald-600">Masuk</th>
                        <th className="px-8 py-6 text-orange-600">Pulang</th>
                        <th className="px-8 py-6">Dokumen</th>
                        <th className="px-8 py-6">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.length > 0 ? filteredData.map((att) => (
                        <tr key={att.id} className="text-sm hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                             <span className="font-bold text-slate-900">{att.user.name}</span>
                          </td>
                          <td className="px-8 py-5 text-slate-500 font-medium">
                            {format(new Date(att.date), "dd MMM yyyy", { locale: id })}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              att.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                              att.status === "LEAVE" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {att.status === "PRESENT" ? "Hadir" : att.status === "LEAVE" ? "Izin" : "Lapangan"}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-emerald-600 font-black">
                            {att.clockIn ? format(new Date(att.clockIn), "HH:mm") : "--:--"}
                          </td>
                          <td className="px-8 py-5 text-orange-600 font-black">
                            {att.clockOut ? format(new Date(att.clockOut), "HH:mm") : "--:--"}
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex gap-2">
                               {att.checkOutPhoto && (
                                 <button onClick={() => setViewPhoto(att.checkOutPhoto)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-all" title="Selfie Pulang">
                                   <Eye size={16} />
                                 </button>
                               )}
                               {att.proofPhoto && (
                                 <button onClick={() => setViewPhoto(att.proofPhoto)} className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-all" title="Bukti Izin">
                                   <Eye size={16} />
                                 </button>
                               )}
                               {!att.checkOutPhoto && !att.proofPhoto && <span className="text-slate-300">-</span>}
                             </div>
                          </td>
                          <td className="px-8 py-5">
                            <button onClick={() => deleteRecord(att.id)} className="w-10 h-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} className="px-8 py-24 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-300">
                            <AlertCircle size={40} />
                            <p className="font-bold italic">Belum ada data untuk periode ini.</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto text-center space-y-10">
              <div className="bg-white p-16 rounded-[3rem] shadow-2xl border border-white inline-block">
                <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-widest">QR Master Kantor</h3>
                {qrCodeData && (
                  <div className="p-6 bg-slate-50 rounded-[2.5rem] border-4 border-slate-100 inline-block mb-8">
                    <img src={qrCodeData} alt="QR" className="w-64 h-64 rounded-xl shadow-inner" />
                  </div>
                )}
                <button onClick={() => window.print()} className="flex items-center gap-3 mx-auto bg-slate-900 text-white px-10 py-5 rounded-2xl hover:bg-indigo-600 transition-all font-black text-sm shadow-xl">
                  <Download size={18} /> Cetak QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Photo Preview Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <button onClick={() => setViewPhoto(null)} className="absolute top-6 right-6 w-12 h-12 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all">
                <X size={24} />
             </button>
             <img 
               src={viewPhoto} 
               alt="Preview" 
               className="w-full aspect-[3/4] object-cover pointer-events-none select-none" 
               onContextMenu={(e) => e.preventDefault()}
             />
             <div className="p-8 text-center bg-white border-t border-slate-100">
                <p className="font-black text-slate-900 text-lg">Dokumentasi Absensi</p>
                <p className="text-sm font-medium text-slate-400">Verifikasi visual karyawan</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
