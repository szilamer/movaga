# Függőségek telepítése
Write-Host "Függőségek telepítése..."
npm install

# Prisma kliens újragenerálása
Write-Host "Prisma kliens újragenerálása..."
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma"
}
npm run prisma:generate

# Build folyamat indítása
Write-Host "Build folyamat indítása..."
npm run build 