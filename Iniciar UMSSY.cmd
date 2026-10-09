@echo off
title Gestor de arranque UMSSY
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar-umssy.ps1"
if errorlevel 1 pause
