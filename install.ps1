$owner = "jagopakaiai"
$repo = "jagopakaiAI-cli"
$binary = "jagopakaiai-cli"
$suffix = "win-x64.exe"

$url = "https://github.com/$owner/$repo/releases/latest/download/${binary}-${suffix}"
$installDir = Join-Path $env:USERPROFILE ".jagopakaiai-cli\bin"
$dest = Join-Path $installDir "${binary}.exe"

if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

Write-Host "Downloading JagoPakaiAI CLI from $url..."
Invoke-WebRequest -Uri $url -OutFile $dest

Write-Host "Adding $installDir to User PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -split ";" -notcontains $installDir) {
    [Environment]::SetEnvironmentVariable("Path", $currentPath + ";" + $installDir, "User")
    $env:Path += ";$installDir"
}

Write-Host "JagoPakaiAI CLI installed successfully! Please restart your terminal."
