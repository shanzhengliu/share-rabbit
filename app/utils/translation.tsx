import { i18n } from "./i18n";
export const translation = (key: string): string | undefined => {
  if (window == undefined) {
    return i18n.en[key];
  }
  const language = window.navigator.language.split("-")[0];

  return i18n[language]?.[key] || i18n.en[key];
};
