import { PostMessageManagerImpl } from "@team-monolith/post-message-manager"
import { OpenSaveCallback } from "./client"

const postMessageManager = new PostMessageManagerImpl()

export function registerSavePostMessage(
  save: (callback: OpenSaveCallback) => void
) {
  postMessageManager.register({
    messageType: "save",
    callback: async () => {
      await new Promise((resolve) => {
        save(resolve)
      })
      return true
    },
  })
}
