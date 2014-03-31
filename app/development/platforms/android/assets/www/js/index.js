// from: https://www.ibm.com/developerworks/community/blogs/victorsh/entry/apache_cordova_and_jquery?lang=en

/* CUSTOM ANDROID LAUNCHER PLUGIN */

window.launcher = function(str, callback) {
    cordova.exec(callback, function(err) {
        callback('Nothing to launch.');
    }, "Launcher", "launch", [str]);
};

window.fileStorage = function(callback) {
    cordova.exec(callback, function(err) {
        callback('Error on file storage: ' + err);
    }, "FileStorage", "getAllStorageLocations", []);
};

/* end of CUSTOM ANDROID LAUNCHER PLUGIN */

/* SETTINGS & DATA */

var settings = {};
settings.DIRECTORY_NAME = "TESSIndiaLearningApp"; // ignore
settings.DIRECTORY_NAME_PREFIX = "TESSIndiaLA_";

var data = {};
data.directoryArray = new Array();
data.tessDirectoryEntry = null;
data.rootDirectory = null;
data.foundDirectories = new Array();
data.learningUnitDirectories = new Array();
data.tessChosenLearningUnit = null;
data.tessChosenLearningUnitSectionInfo = {};
data.deviceStorageLocations = new Array();
data.fileSystem = null;
data.checkedPersistentStorage = false;

/* end of SETTINGS & DATA */

/* LOG */
function appLog(msg) {
    //console.log(msg);
	
    //$('#applog-debugger').removeClass('hidden');
    //$('#applog-debugger-container').append('<p>' + msg + '</p>');
}
/* end of LOG */

/* ERROR */
function appError(msg) {
    //console.error(msg);
    
}
/* end of ERROR */


/* HISTORY FUNCTIONALITY */
var visibleScreenId = '#screen-loader';

// changed from [] due to Akash tablet failing to see [] as a javascript array
var appHistory = new Array();

function showScreen(newScreenId) {
    if(newScreenId == visibleScreenId) {
        return;
    }
    endScreen(visibleScreenId);
    $(visibleScreenId).addClass('hidden');
    $(newScreenId).removeClass('hidden');
    if(visibleScreenId != '#screen-loader') {
        appHistory.push(visibleScreenId);
    }
    visibleScreenId = newScreenId;
    startScreen(visibleScreenId);
}

function showScreenNoHistory(newScreenId) {
    showScreen(newScreenId);
    appHistory.pop();
}


function backOneScreen() {
    previousScreenId = appHistory.pop();
    //appLog('back to screen: ' + previousScreenId);
    $(visibleScreenId).addClass('hidden');
    $(previousScreenId).removeClass('hidden');
    visibleScreenId = previousScreenId; 
}

function resetHistory() {
	// changed from [] due to Akash tablet failing to see [] as a javascript array
	appHistory = new Array();
}
/* end of HISTORY FUNCTIONALITY */

/* FILE FUNCTIONALITY */

function sdCardFound(fileSystem) {
    
	data.fileSystem = fileSystem;
    
    if(data.deviceStorageLocations.length == 0) {
        data.rootDirectory = fileSystem.root;
    	checkRootDirectory();
    } else {
    	data.rootDirectory = getNextStorageLocation();
    }
}

function getNextStorageLocation() {
	
	sl = data.deviceStorageLocations.pop();
	
	data.fileSystem.root.getDirectory(sl, {create:false, exclusive:false}, function(directoryEntry) {
		data.rootDirectory = directoryEntry;
		checkRootDirectory();
	}, function(error) {
		showAppErrorScreen(error);
	});

}

function checkRootDirectory() {
    //alert(data.rootDirectory.fullPath);
    
    findDirectoriesOnSdCard(settings.DIRECTORY_NAME_PREFIX, data.rootDirectory, function(directorySearchArray) {
        // if empty, not found
        // if not empty, then we have multiple directories to care about
        
        //appLog(directorySearchArray);
        
        if(directorySearchArray.length == 0 && data.deviceStorageLocations.length == 0) {
            //appLog("Directory not found on SD Card: " + settings.DIRECTORY_NAME);
            showAppErrorScreen('Directories starting with ' + settings.DIRECTORY_NAME_PREFIX + ' have not been found on the SD card or file system.');
        } else if(directorySearchArray.length == 0) {

        	$('#loader-message').text("Searching for TESS India data on temporary storage...");
        	
        	//window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, sdCardFound, noSdCardFound);
        	data.rootDirectory = getNextStorageLocation();
        	
        } else {
            //appLog("FOUND IT! " + settings.DIRECTORY_NAME);
            //for(i = 0; i < directorySearchArray.length; i++) {
            //    appLog(directorySearchArray[i].fullPath);
            //}
        	
        	if(directorySearchArray.length == 1) {
                // go straight to home page
                data.tessDirectoryEntry = directorySearchArray[0]; 
                showScreenNoHistory('#screen-home');
            } else {
                var fl = $('#folder-list');
                fl.empty();
                var j = 0;
                for(j = 0; j < directorySearchArray.length; j++) {
                    var row = $('<tr id="row-' + j + '"><td style="overflow-wrap: break-word;">' + directorySearchArray[j].fullPath  + '</td></tr>');
                    row.click(function() {
                        row_id = $(this).attr('id').replace('row-', '');
                        chosenDirectory = data.foundDirectories[row_id];
                        data.tessDirectoryEntry = chosenDirectory;
                        showScreenNoHistory('#screen-home');
                    });
                    fl.append(row);
                }
                showScreenNoHistory('#screen-choose-folder');
            }

        }

    }, appError);
    
} 

// returns an array of 
function findDirectoriesOnSdCard(directoryNamePrefix, directoryEntry, searchCompletedCallback, fail) {
    // reset the tess directory entry
    data.tessDirectoryEntry = null;
    // reset the directory array (filled on walk down tree)
    data.directoryArray = new Array();
    
    // fill the directoryArray by walking down the directory tree
    walk({pending:0}, directoryEntry, data.directoryArray, function() {
        var i = 0;
        data.foundDirectories = [];
        for(i = 0; i < data.directoryArray.length; i++) {
            //if(data.directoryArray[i].name == directoryName) {
        	dirName = data.directoryArray[i].name + "";
        	if(dirName.indexOf(settings.DIRECTORY_NAME_PREFIX) == 0) {
                data.foundDirectories.push(data.directoryArray[i]);
            }
        }
        // 1 liner for weinre
        //for(i = 0; i < data.directoryArray.length; i++) { if(data.directoryArray[i].name == directoryName) { data.foundDirectories.push(data.directoryArray[i]); appLog("FOUND: " + data.directoryArray[i].fullPath);} }
        searchCompletedCallback(data.foundDirectories);
    });

}

function walk(parentObject, directoryEntry, walkResults, walkCompleteCallback) {
    // function-only scoped variable
    // how many pending directories are there still to be checked?
    var parent = parentObject;
    // used to store the pending number for this directory
    parent.pending = 0;
    var de = directoryEntry;
    var dr = de.createReader();
    dr.readEntries(function(entries) {
        // loop over the entries
        var i = 0;
        subdirectories = [];
        // loop over first to get just the directories to set pending correctly before the walk call
        for(i = 0; i < entries.length; i++) {
            if(entries[i].isDirectory) {
                // add to the pending directories count
                parent.pending++;
                // add to directory results list
                walkResults.push(entries[i]);
                // add to subdirectories of this directoryentry
                subdirectories.push(entries[i]);
            }
        }
        
        // loop over found subdirectories in this directory...
        for(i = 0; i < subdirectories.length; i++) {
            // now recurse to find the next directories in this directory
            walk({pending:0}, subdirectories[i], walkResults, function() {
                // when the directory finishes itself, then decrement pending
                parent.pending--;
                // if pending is zero all subdirectories have been checked, then do the parent directory callback
                if(parent.pending == 0) {
                    walkCompleteCallback();
                }
            });
        }
        
        // only when at the bottom of the tree (no subdirectories), do we call callback
        if(subdirectories.length == 0) {
            walkCompleteCallback();
        }
    });
    
};

function noSdCardFound(error) {
    appLog('External storage not found');
    appError(error);
    showAppErrorScreen('External storage (SD Card or file system) is not available.');
}

function loadUnitList() {

    var tr = data.tessDirectoryEntry.createReader();
    
    tr.readEntries(function(entries) {
        var ul = $('#unit-list');
        ul.empty();
        data.learningUnitDirectories = new Array();
        var i = 0;
        for(i = 0; i < entries.length; i++) {
            if(entries[i].isDirectory) {
                data.learningUnitDirectories.push(entries[i]);
                // append it
                var row = $('<tr id="unit-id-' + (data.learningUnitDirectories.length - 1) + '"><td style="overflow-wrap: break-word;">' + entries[i].name + '</td></tr>');
                row.click(function() {
                    unit_id = $(this).attr('id').replace('unit-id-', '');
                    //appLog(data.learningUnitDirectories[unit_id]);
                    data.tessChosenLearningUnit = data.learningUnitDirectories[unit_id];
                    showScreen('#screen-learning-unit');
                });
                //appLog(entries[i].name);
                ul.append(row);
            }
        }
    });
    
}

function loadLearningUnit() {
    $('#learning-unit-title').text(data.tessChosenLearningUnit.name);
    $('#learning-unit-accordion').empty();
    data.tessChosenLearningUnitSectionInfo = {};
    
    data.llu = {};
    data.llu.sections = new Array();
    
    // output the directories as "sections" for this Learning Unit
    tr = data.tessChosenLearningUnit.createReader();
    tr.readEntries(function(entries) {
    	// get just the directories
    	var i = 0;
    	// loop over all the directories in this directory
    	for(i = 0; i < entries.length; i++) {
    		if(entries[i].isDirectory) {
    			var sectionParent = entries[i];
    			data.tessChosenLearningUnitSectionInfo[sectionParent.name] = {}
    			data.tessChosenLearningUnitSectionInfo[sectionParent.name]['index'] = i;
    			accordion_id = 'learning-unit-accordion-' + i; 
    			info_id = 'learning-unit-info-' + i; 
    			data.tessChosenLearningUnitSectionInfo[sectionParent.name]['info_id'] = info_id;
    			var accordion = $($('#template-learning-unit-accordion').html().replace('COLLAPSE_ID', accordion_id).replace('COLLAPSE_ID', accordion_id).replace('LU_FILES_ID', info_id));
    		    //accordion.find('.learning-unit-accordion-title').text('Section: ' + sectionParent.name);
    			accordion.find('.learning-unit-accordion-title').text(sectionParent.name);
    		    // now get the files in this directory (!) as the entries...
    		    accordion.find('.learning-unit-accordion-content').empty();
    		    $('#learning-unit-accordion').append(accordion);
    		    
    		    sr = entries[i].createReader();
    		    
    		    sr.readEntries(function(sectionEntries) {
    		    	var j = 0;
        		    for(j = 0; j < sectionEntries.length; j++) {
    		    		var entry = sectionEntries[j];
    		    		pathArray = entry.fullPath.split("/");
    		    		parentDirectory = pathArray[pathArray.length - 2]; 
    		    		section_id = '#' + data.tessChosenLearningUnitSectionInfo[parentDirectory]['info_id'];
		    			section = $(section_id);
		    			file = $('<p>' + entry.name + '</p>');
		    			file.click(function() {
		    				window.launcher(entry.fullPath, function(launchValue) {
    		    			});
		    			});
    		    		section.append(file);
    		    	}
    		    });
    		}
    	}
    });
    
    
    
}

/* end of FILE FUNCTIONALITY */

/* SCREEN FUNCTIONALITY */

function showAppErrorScreen(message) {
    $('#error-info').html('<p>' + message + '</p>');
    showScreen('#screen-error');
}

function loadAboutScreen() {
	// get content from directory "about.html" file
	appLog("load about");
	$('#screen-about-content').html('<h3>Loading...</h3>');
	data.tessDirectoryEntry.getFile('about.html', {create: false, exclusive: false}, function(fileEntry) {
		
		fileEntry.file(function(file) {
			var reader = new FileReader();
		    reader.onloadend = function (evt) {
		        //appLog("read success");
		        $('#screen-about-content').html(evt.target.result);
		    };
		    reader.readAsText(file);
		}, function(error) {
			appLog("about.html file read error: " + error);
			$('#screen-about-content').html("<h3>About Error</h3><p>" + error + "</p>");
		});
		
	}, function(error) {
		appLog("No about.html specified");
		$('#screen-about-content').html("<h3>About Error</h3><p>No about.html is specified for this app.</p><p>Touch the logo above to return to the main screen.</p>");
	});
	
}

function startScreen(screenId) {
    if(screenId == '#screen-home') {
        // load units
        loadUnitList();
    } else if(screenId == '#screen-learning-unit') {
        loadLearningUnit();
    } else if(screenId == '#screen-about') {
    	loadAboutScreen();
    }
}

function endScreen(screenId) {
    
}

/* end of SCREEN FUNCTIONALITY */

$(document).ready(function() { 
    // jQuery is properly loaded at this point
    // so proceed to bind the Cordova's deviceready event
    $(document).bind('deviceready', function() {
        // Now Cordova is loaded
        // its great JS API can be used to access low-level
        // features as accelerometer, contacts and so on
        appLog('App started');
        
        // reset history
        resetHistory();

        // used to make the back button on android available to the user
        document.addEventListener("backbutton", function() {
            if(appHistory.length > 0) {
                backOneScreen();
            } else {
                navigator.app.exitApp();
            }
        }, true);

        window.fileStorage(function(locations) {
        	data.deviceStorageLocations = locations;
        });
        
        $('#loader-message').text("Searching for TESS India data on device storage...");
        // start by checking there is an SD card, and then subsequently checking the directory
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, sdCardFound, noSdCardFound);
        
        $('#tess-india-logo').click(function() {
            showScreen('#screen-home');
        });
        
        $('#btn-home-about').click(function() {
            showScreen('#screen-about');
        });
        
    }); 
});
