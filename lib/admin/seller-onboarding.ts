import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function onboardSeller(input: Record<string, unknown>) {
  const email = String(input.email ?? "").trim().toLowerCase();
  const name = String(input.name ?? "").trim();
  const store = String(input.storeName ?? "").trim();

  if (!email || !name || !store) {
    throw new Error("Seller name, email and store are required.");
  }

  const p = getPrisma();
  if (await p.user.findUnique({ where: { email } })) {
    throw new Error("Email already exists.");
  }

  const password = String(input.password || "NexoraSeller@123");

  return p.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: randomUUID(),
        email,
        name,
        passwordHash: await hashPassword(password),
        role: "SELLER",
        status: "ACTIVE",
      },
    });

    const profileId = randomUUID();
    await tx.$executeRaw`
      insert into "SellerProfile"(
        "id","userId","storeName","gstNumber","commissionBps",
        "verificationStatus","payoutStatus","createdAt","updatedAt"
      )
      values(
        ${profileId},
        ${user.id},
        ${store},
        ${input.gstNumber || null},
        ${Number(input.commissionBps || 1000)},
        "PENDING",
        "HOLD",
        now(),
        now()
      )
    `;

    return { userId: user.id, profileId, email, password };
  });
}
