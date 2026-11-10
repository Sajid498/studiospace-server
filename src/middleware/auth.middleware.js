
import { createRemoteJWKSet, jwtVerify } from "jose";

const authBaseURL =
  process.env.BETTER_AUTH_URL || "http://localhost:5000";

const JWKS = createRemoteJWKSet(
  new URL(`${authBaseURL}/api/auth/jwks`)
);

export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.["better-auth.session_data"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: authBaseURL,
      audience: "better-auth:session-cache",
      algorithms: ["EdDSA"],
    });

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

   req.user = {
  id: payload.sub,
  name: payload.user.name,
  email: payload.user.email,
};

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
