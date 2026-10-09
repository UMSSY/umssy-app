$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot

function Test-Port {
    param([int]$Port)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $connection = $client.ConnectAsync('127.0.0.1', $Port)
        return ($connection.Wait(500) -and $client.Connected)
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Start-ServiceTerminal {
    param([string]$Folder, [string]$Title, [string]$Command)
    $escapedFolder = $Folder.Replace("'", "''")
    $script = @"
`$Host.UI.RawUI.WindowTitle = '$Title'
Set-Location -LiteralPath '$escapedFolder'
$Command
"@
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    # These terminals stay visible so the user can inspect logs and stop with Ctrl+C.
    Start-Process powershell.exe -ArgumentList @('-NoProfile', '-NoExit', '-EncodedCommand', $encoded) | Out-Null
}

try {
    Get-Command npm.cmd -ErrorAction Stop | Out-Null
    foreach ($service in @('frontend', 'backend')) {
        $folder = Join-Path $projectRoot $service
        if (-not (Test-Path (Join-Path $folder 'node_modules'))) {
            throw "Faltan dependencias en $folder. Ejecuta npm.cmd install en esa carpeta."
        }
    }

    Write-Host 'UMSSY - Gestor de arranque' -ForegroundColor Cyan
    if (Test-Port 8080) {
        Write-Host 'El puerto 8080 ya esta activo. No se inicia otro backend.'
    } else {
        Write-Host 'Iniciando backend en el puerto 8080...'
        Start-ServiceTerminal -Folder (Join-Path $projectRoot 'backend') -Title 'UMSSY - Backend' -Command @'
$env:PORT = '8080'
$env:CORS_ORIGIN = 'http://localhost:3001'
$env:JWT_EXPIRES_IN = '8h'
$env:JWT_ALGORITHM = 'HS256'
npm.cmd run start:dev
'@
    }

    if (Test-Port 3001) {
        Write-Host 'El puerto 3001 ya esta activo. No se inicia otro frontend.'
    } else {
        Write-Host 'Iniciando frontend en el puerto 3001...'
        Start-ServiceTerminal -Folder (Join-Path $projectRoot 'frontend') -Title 'UMSSY - Frontend' -Command 'npm.cmd run dev -- --port 3001'
    }

    Write-Host 'Esperando a que ambos servicios respondan...'
    $deadline = (Get-Date).AddSeconds(90)
    $ready = $false
    do {
        try {
            $front = Invoke-WebRequest 'http://localhost:3001/login' -UseBasicParsing -TimeoutSec 3
            $back = Invoke-WebRequest 'http://localhost:8080/docs' -UseBasicParsing -TimeoutSec 3
            $ready = ($front.StatusCode -eq 200 -and $back.StatusCode -eq 200)
        } catch {
            $ready = $false
        }
        if (-not $ready) { Start-Sleep -Seconds 2 }
    } until ($ready -or (Get-Date) -ge $deadline)

    if (-not $ready) {
        throw 'No respondieron ambos servicios a tiempo. Revisa las ventanas de frontend y backend; comprueba que los puertos 3001 y 8080 esten disponibles.'
    }

    Start-Process 'http://localhost:3001/login'
    Write-Host 'Listo. Para detener los servicios, pulsa Ctrl+C en cada terminal.' -ForegroundColor Green
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
