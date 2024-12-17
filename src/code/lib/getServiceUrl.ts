/**
 * transforms codap.{DOMAIN} to {DOMAIN}
 */
export function getMainUrl(): string {
  if (isLocalHostname()) {
    return process.env.REACT_APP_MAIN_URL
  }

  const hostname = window.location.hostname
  const parts = hostname.split(".")

  return `https://${parts.slice(1).join(".")}`
}

/**
 * transforms codap.{DOMAIN} to class.{DOMAIN}
 */
export function getClassRailsUrl(): string {
  if (isLocalHostname()) {
    return process.env.REACT_APP_CLASS_RAILS_URL
  }

  const hostname = window.location.hostname
  const parts = hostname.split(".")

  return `https://class.${parts.slice(1).join(".")}`
}

/**
 * transforms codap.{DOMAIN} to user.{DOMAIN}
 */
export function getUserRailsUrl(): string {
  if (isLocalHostname()) {
    return process.env.REACT_APP_USER_RAILS_URL
  }

  const hostname = window.location.hostname
  const parts = hostname.split(".")

  return `https://user.${parts.slice(1).join(".")}`
}

function isLocalHostname(): boolean {
  const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  return (
    window.location.hostname === "localhost" ||
    ipPattern.test(window.location.hostname)
  )
}
