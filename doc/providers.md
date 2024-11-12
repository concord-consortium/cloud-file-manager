# Providers

Available provider names:
- googleDrive
- interactiveApi
- lara
- localFile
- localStorage
- postMessage
- readOnly
- s3-provider
- testProvider
- url-provider

Legacy providers:
- LegacyGoogleDriveProvider (googleDrive)

## postMessage
This is a special provider. It should **not** be added to the client's list of providers when the client configures the CFM. 

To use this provider the url param `saveSecondaryFileViaPostMessage` should be set. Currently any value works including "false" or "no", but that might change in the future so a value of "yes" or "true" is recommended.

If there is no other provider that has the capability of `export: 'auto'`, then this *postMessage* provider will be used when the client calls `saveAsExport`. Currently the only other provider which has an `export: 'auto'` is the testProvider. When an `export: 'auto'` provider is found the CFM will use this provider's `saveAsExport` method instead of the default behavior of CFM's `saveAsExport`. **TODO** document what the default behavior of saveAsExport is.

The *postMessage* provider's `saveAsExport` sends a message to the parent window:
```js
{
    action: "saveSecondaryFile",
    extension: metadata.extension  // file extension if known
    mimeType: metadata.mimeType,   // file type if known
    content                        // the current file content
}
```

Notes:
This provider will be added to the list of providers configured by the client if the URL param `saveSecondaryFileViaPostMessage` is set.

This provider only supports the export capability. This export capability is only enabled if the url param `saveSecondaryFileViaPostMessage` is set. So adding this provider to the CFM config will have no effect if the the URL parameter is not also set. 

## TODO: add info on each of the other providers