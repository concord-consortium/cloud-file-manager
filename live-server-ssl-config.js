var fs = require("fs")
var os = require("os")
var path = require("path")

/**
 * ### How to setup local certs: ###
 *
 * This file configures live-server to use a certificate stored in the user's home directory rather than in the local project folder.
 * It is used by the `start:secure` script (which uses the `watch:server:secure` script internally).
 *
 * 1. install [mkcert](https://github.com/FiloSottile/mkcert): `brew install mkcert` (install using Scoop or Chocolatey on Windows)
 * 2. Create and install the trusted CA in keychain if it doesn't already exist: `mkcert -install`
 * 3. Ensure you have a `.localhost-ssl` certificate directory in your home directory (create if needed, typically `C:\Users\UserName` on Windows) and cd into that directory
 * 4. Make the cert files: `mkcert -cert-file localhost.pem -key-file localhost.key localhost 127.0.0.1 ::1`
 * 5. Run `npm run start:secure` to run `webpack-dev-server` in development mode with hot module replacement
 *
 **/

module.exports = {
    cert: fs.readFileSync(path.resolve(os.homedir(), ".localhost-ssl/localhost.pem")),
    key: fs.readFileSync(path.resolve(os.homedir(), ".localhost-ssl/localhost.key"))
}
