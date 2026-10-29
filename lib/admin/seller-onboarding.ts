import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { logAdmin } from "@/lib/admin/audit";

export class SellerOnboardingValidationError extends Error {
  constructor(message: string) { super(message); this.name = "SellerOnboardingValidationError"; }
}
export class SellerOnboardingConflict extends Error {
  constructor() { super("Seller email is already registered."); this.name = "SellerOnboardingConflict"; }
}

export async function onboardSeller(input: Record<string, unknown>, adminUserId: string) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const store = typeof input.storeName === "string" ? input.storeName.trim() : "";
  const gst = typeof input.gstNumber === "string" ? input.gstNumber.trim().toUpperCase() : "";
  const password = input.password;
  const commission = input.commissionBps === undefined ? 1000 : input.commissionBps;

  if (!adminUserId || adminUserId.length > 128) throw new Error("Invalid admin identity.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SellerOnboardingValidationError("Enter a valid seller email address.");
  }
  if (name.length < 2 || name.length > 120 || store.length < 2 || store.length > 160) {
    throw new SellerOnboardingValidationError("Seller name must be 2–120 and store name 2–160 characters.");
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128 ||
      !/[A-Za-z]/.test(password) || !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password) || password === "NexoraSeller@123") {
    throw new SellerOnboardingValidationError("Set a unique seller password (12–128 characters, with letters, numbers and a symbol).");
  }
  if (typeof commission !== "number" || !Number.isSafeInteger(commission) || commission < 0 || commission > 10000) {
    throw new SellerOnboardingValidationError("Commission must be a whole number from 0 to 10000 basis points.");
  }
  if (gst && (gst.length !== 15 || !/^[A-Z0-9]{15}$/.test(gst))) {
    throw new SellerOnboardingValidationError("GST number must be 15 letters/digits or empty.");
  }
  const prisma = getPrisma();
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) throw new SellerOnboardingConflict();
  const passwordHash = await hashPassword(password);
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { id: randomUUID(), email, name, passwordHash, role: "SELLER", status: "PENDING_VERIFICATION" },
      });
      const profileId = randomUUID();
      const verification = "PENDING", payout = "HOLD";
      await tx.$executeRaw`
        INSERT INTO "SellerProfile"
          ("id","userId","storeName","gstNumber","commissionBps",
           "verificationStatus","payoutStatus","createdAt","updatedAt")
        VALUES
          (${profileId},${user.id},${store},${gst || null},${commission},
           ${verification},${payout},now(),now())
      `;
      await logAdmin({
        adminUserId, action: "SELLER_ONBOARD", entityType: "SELLER",
        entityId: profileId, summary: "Onboarded seller " + email,
      }, tx);
      return { userId: user.id, profileId, email };
    }, { maxWait: 5000, timeout: 15000 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw new SellerOnboardingConflict();
    }
    throw error;
  }
}
