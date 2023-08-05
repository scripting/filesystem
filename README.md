# filesystem

Just some filesystem routines. 

Nice to have in a <a href="https://www.npmjs.com/package/davefilesystem">package</a>.

Dave Winer

### Updates

#### 8/5/23 by DW

davefilesystem.copyFolder

#### 10/28/20 by DW

Used this package as an <a href="http://this.how/frontier/nodeEditorExample.opml">example</a> to explain how I use the Frontier outliner to edit my JavaScript projects. 

#### 7/10/20 by DW

In fsRecursivelyVisitFiles if the folder doesn't exist, we weren't calling the completion callback, now we do. This would cause nodeStorage to hang when trying to get files from a folder that doesn't exist. 

