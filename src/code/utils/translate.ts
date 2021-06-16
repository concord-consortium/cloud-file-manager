// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import urlParams from './url-params'
import de from './lang/de.json'
import el from './lang/el.json'
import enUS from './lang/en-US.json'
import es from './lang/es.json'
import he from './lang/he.json'
import ja from './lang/ja.json'
import nb from './lang/nb.json'
import nn from './lang/nn.json'
import th from './lang/th.json'
import tr from './lang/tr.json'
import zhHans from './lang/zh-Hans.json'
import zhTW from './lang/zh-TW.json'

const languageFiles = [
  {key: 'de',    contents: de},     // German
  {key: 'el',    contents: el},     // Greek
  {key: 'en-US', contents: enUS},   // US English
  {key: 'es',    contents: es},     // Spanish
  {key: 'he',    contents: he},     // Hebrew
  {key: 'ja' ,   contents: ja},     // Japanese
  {key: 'nb',    contents: nb},     // Norwegian Bokmål
  {key: 'nn',    contents: nn},     // Norwegian Nynorsk
  {key: 'th',    contents: th},     // Thai
  {key: 'tr',    contents: tr},     // Turkish
  {key: 'zh',    contents: zhHans}, // Simplified Chinese
  {key: 'zh-TW', contents: zhTW}    // Traditional Chinese (Taiwan)
]

// returns baseLANG from baseLANG-REGION if REGION exists
const getBaseLanguage = function(langKey: any) {
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
  for (let language of Array.from(languages)) {
    if (language) { return language }
  }
  return undefined
}

const translations =  {}
languageFiles.forEach(function(lang) {
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  translations[lang.key.toLowerCase()] = lang.contents
  // accept full key with region code or just the language code
  const baseLang = getBaseLanguage(lang.key)
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  if (baseLang && !translations[baseLang]) {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    translations[baseLang] = lang.contents
  }
})

const lang = (urlParams as any).lang || getPageLanguage() || getFirstBrowserLanguage()
const baseLang = getBaseLanguage(lang || '')
// CODAP/Sproutcore lower cases language in documentElement
// @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
const defaultLang = lang && translations[lang.toLowerCase()] ? lang : baseLang && translations[baseLang] ? baseLang : "en"

console.log(`CFM: using ${defaultLang} for translation (lang is "${(urlParams as any).lang}" || "${getFirstBrowserLanguage()}")`)

const varRegExp = /%\{\s*([^}\s]*)\s*\}/g

const translate = function(key: any, vars: any, lang: any) {
  if (vars == null) { vars = {} }
  if (lang == null) { lang = defaultLang }
  lang = lang.toLowerCase()
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  let translation = translations[lang] != null ? translations[lang][key] : undefined
  if ((translation == null)) { translation = key }
  return translation.replace(varRegExp, function(match: any, key: any) {
    return Object.prototype.hasOwnProperty.call(vars, key)
            ? vars[key]
            : `'** UKNOWN KEY: ${key} **`
  })
}

export default translate
