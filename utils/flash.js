const { format } = require("util")

module.exports = function flash(options = {}) {
    const safe = options.unsafe === undefined ? true : !options.unsafe

    return function flashMiddleware(req, res, next) {
        if (req.flash && safe) return next()

        req.flash = function flashMessages(type, message) {
            if (this.session === undefined) {
                throw new Error("req.flash() requires sessions")
            }

            const messages = this.session.flash = this.session.flash || {}

            if (type && message) {
                if (arguments.length > 2) {
                    message = format.apply(undefined, Array.prototype.slice.call(arguments, 1))
                } else if (Array.isArray(message)) {
                    message.forEach((value) => {
                        (messages[type] = messages[type] || []).push(value)
                    })
                    return messages[type].length
                }

                return (messages[type] = messages[type] || []).push(message)
            }

            if (type) {
                const queued = messages[type]
                delete messages[type]
                return queued || []
            }

            this.session.flash = {}
            return messages
        }

        next()
    }
}
