var myProductName = "daveFilesystem", myVersion = "0.4.11";   

exports.deleteDirectory = fsDeleteDirectory;
exports.sureFilePath = fsSureFilePath;
exports.newObject = fsNewObject;
exports.getObject = fsGetObject;
exports.recursivelyVisitFiles = fsRecursivelyVisitFiles;
exports.getFolderInfo = fsGetFolderInfo; //3/2/20 by DW
exports.copyFolder = fsCopyFolder; //8/4/23 by DW

const fs = require ("fs");
const utils = require ("daveutils");

var fsStats = {
	ctWrites: 0,
	ctBytesWritten: 0,
	ctWriteErrors: 0,
	ctReads: 0,
	ctBytesRead: 0,
	ctReadErrors: 0
	};

function fsSureFilePath (path, callback) { 
	var splits = path.split ("/");
	path = ""; //1/8/15 by DW
	if (splits.length > 0) {
		function doLevel (levelnum) {
			if (levelnum < (splits.length - 1)) {
				path += splits [levelnum] + "/";
				fs.exists (path, function (flExists) {
					if (flExists) {
						doLevel (levelnum + 1);
						}
					else {
						fs.mkdir (path, undefined, function () {
							doLevel (levelnum + 1);
							});
						}
					});
				}
			else {
				if (callback != undefined) {
					callback ();
					}
				}
			}
		doLevel (0);
		}
	else {
		if (callback != undefined) {
			callback ();
			}
		}
	}
function fsNewObject (path, data, type, acl, callback, metadata) {
	fsSureFilePath (path, function () {
		fs.writeFile (path, data, function (err) {
			var dataAboutWrite = {
				};
			if (err) {
				console.log ("fsNewObject: error == " + JSON.stringify (err, undefined, 4));
				fsStats.ctWriteErrors++;
				if (callback != undefined) {
					callback (err, dataAboutWrite);
					}
				}
			else {
				fsStats.ctWrites++;
				fsStats.ctBytesWritten += data.length;
				if (callback != undefined) {
					callback (err, dataAboutWrite);
					}
				}
			}); 
		});
	}
function fsGetObject (path, callback) {
	fs.readFile (path, "utf8", function (err, data) {
		var dataAboutRead = {
			Body: data
			};
		if (err) {
			fsStats.ctReadErrors++;
			}
		else {
			fsStats.ctReads++;
			fsStats.ctBytesRead += dataAboutRead.Body.length;
			}
		callback (err, dataAboutRead);
		});
	}
function fsListObjects (path, callback) {
	function endsWithChar (s, chPossibleEndchar) {
		if ((s === undefined) || (s.length == 0)) { 
			return (false);
			}
		else {
			return (s [s.length - 1] == chPossibleEndchar);
			}
		}
	fs.readdir (path, function (err, list) {
		if (!endsWithChar (path, "/")) {
			path += "/";
			}
		if (list !== undefined) { //6/4/15 by DW
			for (var i = 0; i < list.length; i++) {
				var obj = {
					s3path: path + list [i],
					path: path + list [i], //11/21/14 by DW
					Size: 1
					};
				callback (obj);
				}
			}
		callback ({flLastObject: true});
		});
	}
function fsRecursivelyVisitFiles (folderpath, fileCallback, completionCallback) { //3/23/16 by DW
	if (folderpath [folderpath.length - 1] != "/") {
		folderpath += "/";
		}
	fs.readdir (folderpath, function (err, list) {
		if (err) { //7/10/20 by DW
			completionCallback ();
			}
		else {
			function doListItem (ix) {
				if (ix < list.length) {
					var f = folderpath + list [ix];
					fs.stat (f, function (err, stats) {
						if (err) {
							doListItem (ix + 1);
							}
						else {
							if (stats.isDirectory ()) { //dive into the directory
								fsRecursivelyVisitFiles (f, fileCallback, function () {
									doListItem (ix + 1);
									});
								}
							else {
								if (fileCallback !== undefined) {
									fileCallback (f);
									doListItem (ix + 1);
									}
								}
							}
						});
					}
				else {
					if (completionCallback !== undefined) {
						completionCallback ();
						}
					else {
						if (fileCallback !== undefined) {
							fileCallback (undefined);
							}
						}
					}
				}
			if (list !== undefined) { //6/4/15 by DW
				doListItem (0);
				}
			else {
				completionCallback (); //7/10/20 by DW
				}
			}
		});
	}
function fsDeleteDirectory (folderpath, callback) { //3/25/16 by DW
	if (folderpath [folderpath.length - 1] != "/") {
		folderpath += "/";
		}
	fs.readdir (folderpath, function (err, list) {
		if (err) {
			console.log ("fsDeleteDirectory: err.message == " + err.message);
			}
		else {
			function doListItem (ix) {
				if (ix < list.length) {
					var f = folderpath + list [ix];
					fs.stat (f, function (err, stats) {
						if (err) {
							doListItem (ix + 1);
							}
						else {
							if (stats.isDirectory ()) { //dive into the directory
								fsDeleteDirectory (f, function () {
									doListItem (ix + 1);
									});
								}
							else {
								fs.unlink (f, function () {
									doListItem (ix + 1);
									});
								}
							}
						});
					}
				else {
					fs.rmdir (folderpath, function () {
						if (callback !== undefined) {
							callback ();
							}
						});
					}
				}
			doListItem (0);
			}
		});
	}
function fsGetFolderInfo (folderpath, folderInfoCallback) { //3/2/20 by DW
	var theFolder = new Array ();
	function fileCallback (f) {
		theFolder.push ({f});
		}
	function completionCallback () {
		function getstats (ix) {
			if (ix < theFolder.length) {
				var item = theFolder [ix];
				fs.stat (item.f, function (err, stats) {
					if (err) {
						console.log ("getstats: f == " + f + ", err.message == " + err.message);
						}
					else {
						item.size = stats.size; //number of bytes in file
						item.whenModified = stats.mtime; //when one of the stats was changed
						item.whenCreated = stats.birthtime;
						}
					getstats (ix + 1);
					});
				}
			else {
				folderInfoCallback (theFolder);
				}
			}
		getstats (0);
		}
	fsRecursivelyVisitFiles (folderpath, fileCallback, completionCallback);
	}
function fsCopyFolder (sourcefolder, destfolder, callback, filecallback) { //8/5/23 by DW
	function completionCallback () {
		callback ();
		}
	fsRecursivelyVisitFiles (sourcefolder, function (fsource) {
		var fname = utils.stringLastField (fsource, "/");
		if (fname != ".DS_Store") {
			var flcopy = true;
			const relpath = utils.stringDelete (fsource, 1, sourcefolder.length);
			if (filecallback !== undefined) { //8/5/23 by DW
				flcopy = filecallback (relpath);
				}
			if (flcopy) {
				const fdest = destfolder + relpath;
				fsSureFilePath (fdest, function () {
					try {
						fs.copyFileSync (fsource, fdest);
						}
					catch (err) {
						console.log ("copyFolder: relpath == " + relpath + ", err.message == " + err.message);
						return;
						}
					const stats = fs.statSync (fsource);
					fs.utimesSync (fdest, stats.birthtime, stats.mtime);
					});
				}
			}
		}, completionCallback);
	}
 
