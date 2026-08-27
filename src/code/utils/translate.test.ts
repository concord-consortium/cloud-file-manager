import fs from "fs"
import path from "path"
import enUS from "./lang/en-US.json"
import sl from "./lang/sl.json"
import translate, { kBundledLanguageKeys } from "./translate"

describe("bundled languages", () => {
  it("stay in sync with the POEditor pull script", () => {
    const scriptPath = path.join(__dirname, "../../../bin/strings-pull-project.sh")
    const scriptContent = fs.readFileSync(scriptPath, "utf8")

    const match = scriptContent.match(/^LANGUAGES=\(([^)]*)\)/m)
    expect(match).not.toBeNull()
    const pulledLangs = Array.from(match![1].matchAll(/"([^"]+)"/g))
      .map(m => m[1])
      .sort()

    // CFM owns en-US (en-US-master.json is pushed to POEditor); the pull
    // script fetches only the translations, so exclude en-US from the bundled
    // set for comparison.
    const bundledNonEnglish = kBundledLanguageKeys.filter(k => k !== "en-US").sort()

    expect(bundledNonEnglish).toEqual(pulledLangs)
  })
})

describe("translate() language fallback", () => {
  it("uses the requested language when it is bundled", () => {
    // compared against the imported JSON rather than a literal, so a future
    // POEditor pull that reworks the Slovenian string doesn't fail a test
    // about fallback behavior
    expect(translate("~MENU.NEW", {}, "sl")).toBe(sl["~MENU.NEW"])
    expect(translate("~MENU.NEW", {}, "sl")).not.toBe(enUS["~MENU.NEW"])
  })

  it("falls back to English when the requested language is not bundled", () => {
    expect(translate("~MENUBAR.UNTITLED_DOCUMENT", {}, "xx")).toBe("Untitled Document")
  })

  it("falls back to English for a key missing from an otherwise-bundled language", () => {
    jest.isolateModules(() => {
      // a deliberately incomplete locale; the real sl.json has all 163 keys
      jest.doMock("./lang/sl.json", () => ({ "~MENU.NEW": "Nov" }))
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const isolatedModule = require("./translate")
      const isolated: typeof translate = isolatedModule["default"]
      expect(isolated("~MENU.NEW", {}, "sl")).toBe("Nov")
      expect(isolated("~MENU.OPEN", {}, "sl")).toBe("Open ...")
    })
    jest.dontMock("./lang/sl.json")
  })

  it("renders the key itself when it exists in no language", () => {
    expect(translate("~NO.SUCH.KEY", {}, "sl")).toBe("~NO.SUCH.KEY")
    expect(translate("~NO.SUCH.KEY", {}, "xx")).toBe("~NO.SUCH.KEY")
  })

  it("still interpolates variables into a fallback translation", () => {
    expect(translate("~FILE_DIALOG.REMOVED_MESSAGE", { filename: "data.codap" }, "xx"))
      .toBe("data.codap was deleted")
  })
})
