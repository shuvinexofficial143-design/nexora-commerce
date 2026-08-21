import { hashPassword } from "@/lib/auth/password";
import { issueSession } from "@/lib/auth/session";
import { createUser, serializeUser } from "@/lib/db/users";
import { apiError, ok, validateRegistration } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = validateRegistration(await request.json());
    const passwordHash = await hashPassword(input.password);
    const user = await createUser({ ...input, passwordHash });
    await issueSession(user.id);
    return ok({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
