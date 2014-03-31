package com.padajo.cordova.plugin;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import java.io.File;
import android.net.Uri;
import java.lang.Math;

import android.util.Log;
import android.webkit.MimeTypeMap;
import android.os.Environment;

/**
 * This class echoes a string called from JavaScript.
 */
public class Launcher extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("launch")) {
            String filePath = args.getString(0);
            this.launch(filePath, callbackContext);
            return true;
        }
        return false;
    }
    
    private void startActivity(Intent i) {
    	cordova.getActivity().startActivity(i);
    }
    
    private void launch(String filePath, CallbackContext callbackContext) {
    	
        if (filePath != null && filePath.length() > 0) {
        	
        	File file = new File(filePath.replace("file://", ""));
        	Intent intent = new Intent(Intent.ACTION_VIEW);

        	String ext = filePath.substring(filePath.lastIndexOf(".") + 1);

        	Log.i("outessindia", ext + " from " + filePath);
        	
        	if(ext.equals("pdf")) {
            	Log.i("outessindia", "load pdf");
	        	intent.setDataAndType(Uri.fromFile(file), "application/pdf");
	        	//intent.setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
	        	startActivity(intent);
        	} else if(ext.equals("m4v") || ext.equals("mp4") || ext.equals("3gp")) {
            	Log.i("outessindia", "load video " + ext);
	        	intent.setDataAndType(Uri.fromFile(file), "video/*");
	        	//intent.setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
	        	startActivity(intent);
        	} else if(ext.equals("txt")) {
            	Log.i("outessindia", "load text file?");
	        	intent.setDataAndType(Uri.fromFile(file), "text/plain");
	        	//intent.setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
	        	startActivity(intent);
        	} else if(ext.equals("epub")) {
            	Log.i("outessindia", "load epub");
	        	intent.setDataAndType(Uri.fromFile(file), "application/epub+zip");
	        	//intent.setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
	        	startActivity(intent);
        	} else {
            	Log.i("outessindia", "load other");
	    		MimeTypeMap myMime = MimeTypeMap.getSingleton();
	    		intent.setDataAndType(Uri.fromFile(file), myMime.getMimeTypeFromExtension(ext));
	        	//intent.setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
	        	startActivity(intent);
    		}	
        	
            callbackContext.success(filePath);
        } else {
            callbackContext.error("Expected a file path.");
        }
    }

}