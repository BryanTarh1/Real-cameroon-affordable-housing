/** Password fields stay masked by default and become readable only after an explicit user action. */
export function getPasswordInputType(isVisible: boolean) {
  return isVisible ? "text" : "password";
}
