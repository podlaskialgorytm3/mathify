import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { status: true },
  });

  if (!user) {
    return NextResponse.json({ status: "NOT_FOUND" });
  }

  return NextResponse.json({ status: user.status });
}
