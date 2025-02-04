@echo off
del config.ini
copy config0.ini config.ini
:loop
node index.js
goto loop