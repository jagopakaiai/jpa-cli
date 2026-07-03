$owner = "jagopakaiai"
$repo = "jpa-cli"
$binary = "jpa-cli"
$suffix = "win-x64.exe"

$url = "https://github.com/$owner/$repo/releases/latest/download/${binary}-${suffix}"
$installDir = Join-Path $env:USERPROFILE ".jpa-cli\bin"
$dest = Join-Path $installDir "${binary}.exe"

if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

Write-Host "Downloading JPA CLI from $url..."
Invoke-WebRequest -Uri $url -OutFile $dest

Write-Host "Adding $installDir to User PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -split ";" -notcontains $installDir) {
    [Environment]::SetEnvironmentVariable("Path", $currentPath + ";" + $installDir, "User")
    $env:Path += ";$installDir"
}

Write-Host "JPA CLI installed successfully! Please restart your terminal."
