The CFM tracks if the document is "dirty". This means the document has been modified since the last time it was saved. When the document is "dirty":
- an "UNSAVED" badge is displayed in the title bar
- when the user tries to close the window, a dialog will be shown asking if they want to save first.
- if autosave is enabled, the document will be saved if it is dirty

The CFM only marks the document dirty itself in a few cases. It is mainly the responsibility of the client to tell the CFM when the document is dirty. This is done using `client.dirty()`.

When the document is saved by a provider this dirty state is reset to false. However there are a few caveats to this approach.

If the user changes the document while the CFM is saving it, the revision of the file that is saved might already be out of date when the save completes. However the CFM doesn't take that into account and will reset the dirty state to false. The CFM doesn't reset the dirty state at the beginning of the save because the save might fail. Because of this, these intermediate changes during save could be lost. Clients can handle this case by listening to the `fileSaved` event and then comparing the content that was successfully saved to the current content. If current content is different, then mark the document dirty again with `client.dirty()`.  

If the provider has switched from storing wrapped to unwrapped documents or vice versa, the CFM will identify this and mark the document as "dirty" immediately after opening it. This handled by the `requiresConversion` method. 

The client might need to modify a document right after opening. If this is automatic without user interaction, the client might **not** want these changes to make the document "dirty". If autosaving is disabled the "UNSAVED" badge will be shown even though the user hasn't changed anything themselves. If autosaving is enabled the user might see the "UNSAVED" badge flash and disappear. Additionally when the saving of document is an indication of student progress, this initial immediate saving will make it appear the user has changed the document when really they have not. Because it is the responsibility of the client to tell the CFM when the content is dirty these cases can be handled by just not marking the document dirty.

## Autosave
When autosave is enabled by passing the `autoSaveInterval` configuration option, the CFM will try to autosave on this interval. If the document is not "dirty" then the autosave will do nothing. So when autosave is used, it is important that the client calls `client.dirty()` otherwise the document will not be auto saved.

When the autosave loop sees the document is dirty, it will request the content from the client using the `getContent` event and then save the result.

## Shared doc info
The CFM normally includes the shared doc info in the original document that is being shared. This is so the author of the original document can update the shared document when they re-open the original document. 

Some providers allow the user to not include this shared doc info in the saved file. This is useful if you want to send a document to someone but you don't want them to be able update the shared document.

The shared doc info is related to the dirty state of the document because the CFM needs to know to save the original document once this shared doc info has been added to it. When the document is shared or unshared the CFM will mark the document as dirty. This is one case where the CFM will actually mark the document dirty itself.

This is further complicated by the unwrapped option in the CFM. When the client configures the CFM to store the content unwrapped, it is the responsibility of the client to store the shared doc info inside of its content. Clients using the unwrapped option do this by listening for the `sharedFile` event from the CFM. After updating the content a client should set the dirty state so the CFM knows it should save the client's updated content.

## Wrapped vs Unwrapped files
The CFM has an option to either store the content from the client directly or to wrap this content with CFM specific metadata. CODAP chooses to not wrap the file content. This means that CODAP has to maintain its own version of at least the shared metadata inside of its content. CODAP stores this shared data at `metadata.shared`. 

When the CFM saves a file without the shared doc info and is running in unwrapped mode, it looks for this `metadata.shared` section and doesn't save it. 

When a CODAP document is opened, the CODAP client listens for the `openedFile` event and then reads the shared doc info out of the `metadata.shared`. And it then returns this shared doc info in the call back of `openedFile`, this way the CFM knows what to put in the sharing dialog for the document.
  
## Document names
TODO: this section needs more work. 

When the document is renamed, its dirty state is unmodified. So in essence the name is not considered part of the content. However some providers do look for the name in the content, so there is probably some path where the document renaming causes the content to be updated.

In some cases the document name is used as the file name. For example in google drive and local file saving.

When the document is loaded by the s3-provider, lara-provider, or the legacy document-store-provider it looks in the content in several places to figure out the name. This includes looking in the CODAP locations where the name is saved.
