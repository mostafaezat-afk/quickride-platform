@echo off
echo Starting QuickRide Backend...
cd /d "c:\Users\Administrator\Documents\dumps\QuickRide\Backend"
start /MIN "QuickRide Backend" cmd /c "node server.js"

echo Starting QuickRide Frontend...
cd /d "c:\Users\Administrator\Documents\dumps\QuickRide\Frontend"
start /MIN "QuickRide Frontend" cmd /c "npm run dev"

echo QuickRide servers have been started.
exit
