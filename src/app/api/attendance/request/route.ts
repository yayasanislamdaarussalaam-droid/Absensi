import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { type, reason, photo } = await req.json();
    const userId = (session.user as any).id;
    const today = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: { userId, date: startOfDay(today) }
      }
    });

    if (existing) {
      return NextResponse.json(
        { message: "Anda sudah melakukan aktivitas absensi hari ini" },
        { status: 400 }
      );
    }

    await prisma.attendance.create({
      data: {
        userId,
        date: startOfDay(today),
        status: type, // LEAVE or FIELD_WORK
        reason,
        proofPhoto: photo,
        clockIn: null, // No clock in for leave
      }
    });

    return NextResponse.json({ message: "Permohonan izin berhasil dikirim" });
  } catch (error) {
    console.error("Request error:", error);
    return NextResponse.json({ message: "Gagal mengirim izin" }, { status: 500 });
  }
}
