import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parse } from "date-fns";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { month } = await req.json(); // Format: "yyyy-MM"
    const targetDate = parse(month, "yyyy-MM", new Date());
    
    await prisma.attendance.deleteMany({
      where: {
        date: {
          gte: startOfMonth(targetDate),
          lte: endOfMonth(targetDate),
        },
      },
    });

    return NextResponse.json({ message: `Semua data bulan ${month} berhasil dihapus` });
  } catch (error) {
    console.error("Delete month error:", error);
    return NextResponse.json({ message: "Gagal menghapus data bulanan" }, { status: 500 });
  }
}
