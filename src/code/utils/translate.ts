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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/de' or its correspondin... Remove this comment to see the full error message
import de from './lang/de'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/el' or its correspondin... Remove this comment to see the full error message
import el from './lang/el'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/en-US' or its correspon... Remove this comment to see the full error message
import enUS from './lang/en-US'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/es' or its correspondin... Remove this comment to see the full error message
import es from './lang/es'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/he' or its correspondin... Remove this comment to see the full error message
import he from './lang/he'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/ja' or its correspondin... Remove this comment to see the full error message
import ja from './lang/ja'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/nb' or its correspondin... Remove this comment to see the full error message
import nb from './lang/nb'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/nn' or its correspondin... Remove this comment to see the full error message
import nn from './lang/nn'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/th' or its correspondin... Remove this comment to see the full error message
import th from './lang/th'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/tr' or its correspondin... Remove this comment to see the full error message
import tr from './lang/tr'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/zh-Hans' or its corresp... Remove this comment to see the full error message
import zhHans from './lang/zh-Hans'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './lang/zh-TW' or its correspon... Remove this comment to see the full error message
import zhTW from './lang/zh-TW'

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
