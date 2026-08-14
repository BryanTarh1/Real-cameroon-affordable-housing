export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  localTestingExportToken: process.env.AHC_LOCAL_TEST_EXPORT_TOKEN ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Meta WhatsApp Cloud API values remain server-only project secrets. */
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  whatsappOwnerPhone: process.env.WHATSAPP_OWNER_PHONE ?? "",
  whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME ?? "",
  whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en",
  whatsappWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET ?? "",
  /** Canonical production link sent in the approved owner utility template. */
  publicAppUrl: process.env.AHC_PUBLIC_APP_URL ?? "https://affordableho-8aahm5dj.manus.space",
};
