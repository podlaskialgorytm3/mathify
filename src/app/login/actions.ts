"use server";

import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";

export async function checkUserStatus(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { status: true }
  });

  if (!user) {
    return { status: "NOT_FOUND" };
  }

  return { status: user.status as string };
}
