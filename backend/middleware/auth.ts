import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = {
      id: decoded.sub as string,
      email: decoded.email as string,
      role: decoded.role as string,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
