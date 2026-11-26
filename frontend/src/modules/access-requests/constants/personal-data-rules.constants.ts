export const SIS_CODE_LENGTH = 9;

export const ID_CARD_MAX_LENGTH = 10;
export const DIGIT_ONLY_FIELDS = ["idCardNumber", "sisCode"] as const;

// Dominios reales que se aceptan tal cual y sirven de referencia para detectar erratas como «gbail.com»
export const KNOWN_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "hotmail.es",
  "outlook.com",
  "outlook.es",
  "yahoo.com",
  "yahoo.es",
  "ymail.com",
  "icloud.com",
  "live.com",
  "msn.com",
  "mail.com",
  "email.com",
  "proton.me",
  "protonmail.com",
  "umss.edu.bo",
  "est.umss.edu.bo",
] as const;

// Dominios de primer nivel reales. Uno que no esté aquí solo se rechaza si es una errata evidente de alguno, como «.con» de «.com»
export const KNOWN_EMAIL_TLDS = [
  "com",
  "net",
  "org",
  "edu",
  "gov",
  "info",
  "io",
  "co",
  "cm",
  "om",
  "me",
  "dev",
  "app",
  "bo",
  "ar",
  "br",
  "cl",
  "pe",
  "mx",
  "es",
  "us",
  "uk",
  "test",
] as const;
