import type { PublicLanguage } from "./marketplaceLocale";

type AuthErrorInput = { message?: string; code?: string };

export type LocalAuthFeedback = {
  title: string;
  body: string;
};

const copy = {
  en: {
    invalid: { title: "Email or password not recognised", body: "Check both details, complete the security check again, then try once more." },
    locked: { title: "Too many attempts", body: "For your protection, wait 15 minutes before trying again." },
    suspended: { title: "This account is suspended", body: "Contact AHC support if you believe this is a mistake." },
    security: { title: "Security check needed", body: "Complete the security check again before you sign in." },
    generic: { title: "We could not sign you in", body: "Your account was not changed. Check your connection and try again." },
    securityPending: "Complete the security check to enable secure sign-in.",
    securityReady: "Security check complete. You can sign in once.",
    signingIn: "Signing in securely…",
    creating: "Creating your AHC account…",
  },
  fr: {
    invalid: { title: "E-mail ou mot de passe non reconnu", body: "Vérifiez les deux informations, terminez à nouveau le contrôle de sécurité, puis réessayez." },
    locked: { title: "Trop de tentatives", body: "Pour protéger votre compte, attendez 15 minutes avant de réessayer." },
    suspended: { title: "Ce compte est suspendu", body: "Contactez l’assistance AHC si vous pensez qu’il s’agit d’une erreur." },
    security: { title: "Contrôle de sécurité requis", body: "Terminez à nouveau le contrôle de sécurité avant de vous connecter." },
    generic: { title: "Connexion impossible", body: "Votre compte n’a pas été modifié. Vérifiez votre connexion puis réessayez." },
    securityPending: "Terminez le contrôle de sécurité pour activer la connexion sécurisée.",
    securityReady: "Contrôle de sécurité terminé. Vous pouvez vous connecter une seule fois.",
    signingIn: "Connexion sécurisée en cours…",
    creating: "Création de votre compte AHC…",
  },
} as const;

export function getLocalAuthUiCopy(language: PublicLanguage) {
  return copy[language];
}

export function getLocalAuthFailure(error: AuthErrorInput, language: PublicLanguage): LocalAuthFeedback {
  const message = error.message?.toLowerCase() ?? "";
  const ui = getLocalAuthUiCopy(language);

  if (error.code === "TOO_MANY_REQUESTS" || message.includes("too many attempts")) return ui.locked;
  if (message.includes("suspended")) return ui.suspended;
  if (message.includes("turnstile") || message.includes("captcha") || message.includes("security check")) return ui.security;
  if (error.code === "UNAUTHORIZED" || message.includes("invalid email or password")) return ui.invalid;
  return ui.generic;
}
