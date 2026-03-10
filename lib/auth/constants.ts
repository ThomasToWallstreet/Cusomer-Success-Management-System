export const AUTH_SESSION_COOKIE = "ka_csm_session";
export const AUTH_IDENTITY_COOKIE = "ka_csm_identity";

export const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS || 14);
export const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || "replace-this-in-production";
