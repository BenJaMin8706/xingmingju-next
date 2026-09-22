@echo off
cd /d C:\Users\jedi\xingmingju-next
break>verify-out.txt
"C:\Program Files\nodejs\node.exe" node_modules\eslint\bin\eslint.js . >>verify-out.txt 2>&1
echo ESLINT_EXIT=%ERRORLEVEL%>>verify-out.txt
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next build >>verify-out.txt 2>&1
echo BUILD_EXIT=%ERRORLEVEL%>>verify-out.txt
echo DONE>>verify-out.txt
