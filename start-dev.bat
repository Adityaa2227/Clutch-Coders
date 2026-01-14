@echo off
start cmd /k "cd server && npm run dev"
start cmd /k "cd client && npm run dev"
echo FlexPass Development Environment Started!
echo Server: http://localhost:5000
echo Client: http://localhost:5173
