import { getPrisma } from "@/lib/db/prisma";
import type { CheckoutAddress } from "@/types/checkout";

function serializeAddress(address: {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}): CheckoutAddress {
  return {
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
}

export async function listAddressesForUser(userId: string) {
  const rows = await getPrisma().address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return rows.map(serializeAddress);
}

export async function createAddressForUser(
  userId: string,
  input: Omit<CheckoutAddress, "id">,
) {
  const prisma = getPrisma();
  const existingCount = await prisma.address.count({ where: { userId } });

  const row = await prisma.address.create({
    data: {
      userId,
      label: input.label,
      fullName: input.fullName,
      phone: input.phone,
      line1: input.line1,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country || "India",
      isDefault: existingCount === 0,
    },
  });

  return serializeAddress(row);
}

export async function deleteAddressForUser(userId: string, addressId: string) {
  const prisma = getPrisma();
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
    select: { id: true, isDefault: true },
  });

  if (!address) return false;

  await prisma.address.delete({ where: { id: address.id } });

  if (address.isDefault) {
    const replacement = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (replacement) {
      await prisma.address.update({
        where: { id: replacement.id },
        data: { isDefault: true },
      });
    }
  }

  return true;
}
