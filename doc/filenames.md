# Filenames
The CFM tracks both a `name` and `filename` in the metadata it keeps about the currently open file. 

When a client starts up. If it doesn't load an existing file the CFM will not have a `name` or `filename`. When the user saves the file the save dialog will show the CFM's `MENUBAR.UNTITLED_DOCUMENT` string as the name. There is not a configuration option for clients to override this default name.

When a file is loaded the CFM figures out the `name` and `filename`. When the filesystem supports file names these fields come from the actual filesystem file name. If the filesystem does not support file names, the CFM will look for the name inside of the content of the file. It looks in:
`docName`, `name`, and `content.name`. The client shouldn't have to set one of these properties. The `name` property should be set by the CFM when it saves a file in one of these file systems. If the client is using the *unwrapped* mode for files then is should be careful not to use this `name` property for something else since it will get overridden by the CFM.

Some clients need to know what the current document name is. To do this they have to handle the following events: `openedFile`, `savedFile`, and `renamedFile`.
- `openedFile`: the filename can be found in `event.data.metadata.filename`.
- `savedFile`: the user might have renamed the file when saving it. The filename is in `event.state.metadata.filename`. 
- `renamedFile`: the user renamed the file in CFM itself. The filename is in `event.state.metadata.filename`. 

When these events are proxied through an iframe like the way SageModeler embeds CODAP, the `event.state` will be undefined. So in this case client won't be able to track the document name. :shrug:

It is best if clients do not store the filename or name in their own content. This value can get out of sync with the name in the filesystem. The CFM will only add the `name` to unwrapped content if the file is being saved in a filesystem without file names.

## Additional details

As described above, when a document is loaded the `metadata.name` is figured out based on the filename when the provider filesystem supports filenames. If the provider filesystem doesn't support filenames (for example the S3 provider) the filename is based on the content of the file:
```js
              const name =
                metadata.name
                || metadata.providerData.name
                || data.docName
                || data.name
                || data.content?.name
```

When the CFM shares a document it automatically adds a name property at the top level of the content, this is done in `Client#setShareState`. Because this is only done in the `setShareState` method, it has to be the responsibility of non-sharing providers to set this name property when necessary. There are no examples of this currently, and it might take some refactoring to make it possible

### Default extension
The default extension is used by `metadata.rename(name)`. This method is called when the s3-provider loads a file. 

`rename` handles several cases:
- if the name has the default extension configured by the client, this extension will be stripped from the `name` and the `filename` will retain the extension.
- if the name does not have the default extension, the name will be left alone and the filename will be modified to be `${name}.${CloudMetadata.Extension}`

Note this might cause problems when multiple extensions are supported. 
For example CODAPv3 supports `.codap` and `.codap3` files. 
It sets the default extension to `.codap3`.
If a `.codap` file is loaded and somehow the `docName`, `name` or `content.name` is stored as `something.codap`. Then when the document is loaded from a shared provider the result will be a name of `something.codap` and a filename of `something.codap.codap3`.

There is a `readableExtensions` configuration option which CODAPv3 includes the `codap` extension. However these `readableExtensions` are not used by `metadata.rename`.

Therefore it is best if the name stored at the top level of the content when it is saved doesn't included the extension. This way the duplicate extension problem shouldn't happen. This seems to be what is already happening. This name is stored by `client.setShareState` and it is set to the `metadata.name`. 

## TODO
- Document how `metadata.name` is managed when a file is saved and renamed.
- Document how `readableExtensions` are used.
- Document better how the default extension is used.

