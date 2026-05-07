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

    const { photo, clientTime } = await req.json();
    const today = clientTime ? new Date(clientTime) : new Date();
    const userId = (session.user as any).id;
    
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: startOfDay(today),
        },
      },
    });

    if (!attendance || !attendance.clockIn) {
      return NextResponse.json(
        { message: "Anda belum Clock In hari ini" },
        { status: 400 }
      );
    }

    if (attendance.clockOut) {
      return NextResponse.json(
        { message: "Anda sudah melakukan Clock Out" },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: today,
        checkOutPhoto: photo,
      },
    });

    return NextResponse.json({
      message: "Berhasil Clock Out dengan Selfie",
      time: updated.clockOut,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ message: "Gagal memproses selfie" }, { status: 500 });
  }
}
