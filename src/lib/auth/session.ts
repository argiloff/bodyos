import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { verifyMobileToken } from "./mobileToken";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireUser(req?: Request) {
  if (req) {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (bearerToken) {
      const userId = verifyMobileToken(bearerToken);
      if (userId) return userId;
    }
  }

  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}
