import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    let token;

    // Check if the authorization header exists and starts with "Bearer"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get just the token string
            token = req.headers.authorization.split(" ")[1];

            // Decode the token using your Supabase secret
            const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

            // Supabase stores the user's UUID in the "sub" (subject) field of the JWT
            req.user = {
                id: decoded.sub,
                // You can also access email here if you need it: decoded.email
            };

            next();
        } catch (error) {
            console.error("Token verification failed:", error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token provided" });
    }
};
