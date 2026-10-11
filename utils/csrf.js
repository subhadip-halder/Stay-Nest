const crypto = require("crypto")
const ExpressError = require("./ExpressError")

module.exports = (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()
    const supplied = req.body?._csrf || req.query?._csrf || req.get("x-csrf-token")
    const expected = req.session?.csrfToken
    const suppliedBuffer = typeof supplied === "string" ? Buffer.from(supplied) : Buffer.alloc(0)
    const expectedBuffer = typeof expected === "string" ? Buffer.from(expected) : Buffer.alloc(0)
    const valid = expectedBuffer.length > 0 && suppliedBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
    if (!valid) return next(new ExpressError(403, "Invalid or missing security token. Refresh the page and try again."))
    next()
}
