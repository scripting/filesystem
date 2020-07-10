### Just some filesystem routines

Nice to have in a <a href="https://www.npmjs.com/package/davefilesystem">package</a>.

Dave Winer

### 7/10/20 by DW

In fsRecursivelyVisitFiles if the folder doesn't exist, we weren't calling the completion callback, now we do. This would cause nodeStorage to hang when trying to get files from a folder that doesn't exist. 

