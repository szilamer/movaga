# Prisma kliens újragenerálása
Write-Host "Prisma kliens újragenerálása..."
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma"
}
npm run prisma:generate

# Fejlesztői szerver indítása
Write-Host "Fejlesztői szerver indítása..."
npm run dev 