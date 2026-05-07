import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { qrData, clientTime } = await req.json();
    const today = clientTime ? new Date(clientTime) : new Date();

    // Verify QR code secret
    const config = await prisma.officeConfig.findUnique({
      where: { id: "default" },
    });

    if (!config || qrData !== config.qrSecret) {
      return NextResponse.json({ message: "Invalid QR Code" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    
    // Find attendance for today
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: startOfDay(today),
        },
      },
    });

    if (!attendance) {
      // Clock In
      const newAttendance = await prisma.attendance.create({
        data: {
          userId,
          date: startOfDay(today),
          clockIn: today,
        },
      });
      return NextResponse.json({
        message: "Berhasil Clock In",
        type: "IN",
        time: newAttendance.clockIn,
      });
    } else if (!attendance.clockOut) {
      // Clock Out
      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          clockOut: today,
        },
      });
      return NextResponse.json({
        message: "Berhasil Clock Out",
        type: "OUT",
        time: updatedAttendance.clockOut,
      });
    } else {
      return NextResponse.json(
        { message: "Anda sudah melakukan absensi hari ini" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
