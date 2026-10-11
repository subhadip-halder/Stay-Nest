const ExpressError = require("./ExpressError")

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const MAX_BUCKETS = 20000
const attempts = new Map()

function keyFor(req, action) {
    return `${action}:${req.ip || req.socket.remoteAddress || "unknown"}`
}

function prune(now) {
    for (const [key, bucket] of attempts) {
        if (bucket.resetAt <= now) attempts.delete(key)
    }
}

function authRateLimit(action) {
    return (req, res, next) => {
        const now = Date.now()
        const key = keyFor(req, action)
        let bucket = attempts.get(key)
        if (!bucket || bucket.resetAt <= now) {
            if (attempts.size >= MAX_BUCKETS) prune(now)
            if (attempts.size >= MAX_BUCKETS) {
                return next(new ExpressError(429, "Too many authentication requests. Try again later."))
            }
            bucket = { count: 0, resetAt: now + WINDOW_MS }
            attempts.set(key, bucket)
        }
        if (bucket.count >= MAX_ATTEMPTS) {
            res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000))
            return next(new ExpressError(429, "Too many authentication requests. Try again later."))
        }
        bucket.count += 1
        next()
    }
}

authRateLimit.reset = (req, action) => attempts.delete(keyFor(req, action))
module.exports = authRateLimit
