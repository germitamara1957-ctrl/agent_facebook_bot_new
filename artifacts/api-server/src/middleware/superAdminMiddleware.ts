import { Request, Response, NextFunction } from "express";
import { verifySuperAdminToken, type SuperAdminJwtPayload } from "../lib/auth.js";

export interface SuperAdminRequest extends Request {
  superAdmin?: SuperAdminJwtPayload;
}

export function superAdminMiddleware(
  req: SuperAdminRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifySuperAdminToken(token);
  if (!payload) {
    res.status(403).json({ message: "Forbidden — Super admin access required" });
    return;
  }

  req.superAdmin = payload;
  next();
}
