ou-tess-india-learning-app
==========================

Cordova based learning app

You need to first install cordova:

http://cordova.apache.org/docs/en/3.3.0/

Specifically:

http://cordova.apache.org/docs/en/3.3.0/guide_cli_index.md.html#The%20Command-Line%20Interface

When downloading the app for development purposes, remember to go to 

app/development

and then run:

cordova platform update android

(or add android if not in platforms)

Weinre: use a local install
---------------------------

In index.html there is a line loading up JS from a 192.168.x.y address

This is a local install of weinre:

sudo npm install -g weinre

And you run it with:

weinre --boundHost -all-

And then change the IP to the IP of the machine (assuming they are on the same network)