import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let config = await prisma.officeConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.officeConfig.create({
        data: { id: "default", qrSecret: "office-secret-123" },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Admin config fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
