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
export function registerReloadPostMessage(reload: () => void) {
  postMessageManager.register({
    messageType: "reload",
    callback: async () => {
      reload()
      return true
    },
  })
}

export function postiframeLoadedMessageToParent() {
  if (window === window.parent) return
  const iframeKey = new URLSearchParams(window.location.search).get(
    "iframe_key"
  )
  if (!iframeKey) return
  try {
    postMessageManager.send({
      messageType: `iframeLoaded-${iframeKey}`,
      payload: null,
      target: window.parent,
      targetOrigin: "*",
    })
  } catch {
    /* ignore */
  }
}

export function postProjectLoadedMessageToParent(
  projectDataUpdatedAt: string | null
) {
  if (window === window.parent) return
  try {
    postMessageManager.send({
      messageType: "projectLoaded",
      payload: projectDataUpdatedAt,
      target: window.parent,
      targetOrigin: "*",
    })
  } catch {
    /* ignore */
  }
}
