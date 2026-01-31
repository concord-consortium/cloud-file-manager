import urlParams from './url-params'
import de from './lang/de.json'
import el from './lang/el.json'
import enUS from './lang/en-US.json'
import es from './lang/es.json'
import fa from './lang/fa.json'
import he from './lang/he.json'
import ja from './lang/ja.json'
import ko from './lang/ko.json'
import nb from './lang/nb.json'
import nn from './lang/nn.json'
import pl from "./lang/pl.json"
import ptBR from './lang/pt-BR.json'
import th from './lang/th.json'
import tr from './lang/tr.json'
import zhHans from './lang/zh-Hans.json'
import zhTW from './lang/zh-TW.json'

type LanguageFileContent = Record<string, string>
interface LanguageFileEntry {
  key: string
  contents: LanguageFileContent
}

const languageFiles: LanguageFileEntry[] = [
  {key: 'de',       contents: de},     // German
  {key: 'el',       contents: el},     // Greek
  {key: 'en-US',    contents: enUS},   // US English
  {key: 'es',       contents: es},     // Spanish
  {key: 'fa',       contents: fa},     // Farsi (Persian)
  {key: 'he',       contents: he},     // Hebrew
  {key: 'ja' ,      contents: ja},     // Japanese
  {key: 'ko' ,      contents: ko},     // Korean
  {key: 'nb',       contents: nb},     // Norwegian Bokmål
  {key: 'nn',       contents: nn},     // Norwegian Nynorsk
  {key: 'pl',       contents: pl},     // Polish Polski
  {key: 'pt-BR',    contents: ptBR},   // Brazilian Portuguese
  {key: 'th',       contents: th},     // Thai
  {key: 'tr',       contents: tr},     // Turkish
  {key: 'zh-Hans',  contents: zhHans}, // Simplified Chinese
  {key: 'zh-TW',    contents: zhTW}    // Traditional Chinese (Taiwan)
]

// returns baseLANG from baseLANG-REGION if REGION exists
const getBaseLanguage = function(langKey: string) {
  return langKey.split("-")[0]
}

// use language of page, which is used by CODAP, with separate build for each language
const getPageLanguage = function() {
  const pageLang = document.documentElement.lang
  return pageLang && (pageLang !== "unknown")
          ? pageLang
          : undefined
}

const getFirstBrowserLanguage = function() {
  const nav = window.navigator
  const languages = nav ? (nav.languages || []).concat([nav.language, (nav as any).browserLanguage, (nav as any).systemLanguage, (nav as any).userLanguage]) : []
  for (const language of languages) {
    if (language) { return language }
  }
  return undefined
}

const translations: Record<string, LanguageFileContent> =  {}
languageFiles.forEach(function(lang) {
  translations[lang.key.toLowerCase()] = lang.contents
  // accept full key with region code or just the language code
  const baseLang = getBaseLanguage(lang.key)
  if (baseLang && !translations[baseLang]) {
    translations[baseLang] = lang.contents
  }
})

const lang = (urlParams as any).lang || getPageLanguage() || getFirstBrowserLanguage()
const baseLang = getBaseLanguage(lang || '')
// CODAP/SproutCore lower cases language in documentElement
const defaultLang: string = lang && translations[lang.toLowerCase()] ? lang : baseLang && translations[baseLang] ? baseLang : "en"

let gCurrentLanguage = defaultLang

export function getCurrentLanguage() {
  return gCurrentLanguage
}

export function setCurrentLanguage(lang: string) {
  gCurrentLanguage = lang
}

// console.log(`CFM: using ${defaultLang} for translation (lang is "${(urlParams as any).lang}" || "${getFirstBrowserLanguage()}")`)

const varRegExp = /%\{\s*([^}\s]*)\s*\}/g

const translate = function(key: string, vars?: Record<string, string>, lang?: string) {
  const varsMap = vars ?? {}
  lang = lang ?? gCurrentLanguage
  lang = lang.toLowerCase()
  let translation = translations[lang]?.[key]
  if (!translation) { translation = key }
  return translation.replace(varRegExp, function(match: string, key: string) {
    return Object.prototype.hasOwnProperty.call(varsMap, key)
            ? varsMap[key]
            : `'** UNKNOWN KEY: ${key} **`
  })
}

export const getDefaultLang = () => defaultLang

export const getSpecialLangFontClassName = (lang: string) => {
  const specialLangFonts = ["fa", "th", "ja", "ko", "zh-Hans", "zh-TW", "he"]
  return specialLangFonts.includes(lang) ? `lang-${lang}` : ""
}

export default translate
