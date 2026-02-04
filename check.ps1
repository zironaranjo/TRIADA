# TRIADA Security Check & Push
# Script para revisar cambios antes de subir a GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      🛡️  TRIADA SECURITY CHECK  🛡️      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Comprobar estado de Git
$status = git status --short

if (-not $status) {
    Write-Host "✅ No hay cambios pendientes. Todo está actualizado." -ForegroundColor Green
    Exit
}

# 2. Mostrar archivos cambiados
Write-Host "📋 Archivos modificados:" -ForegroundColor Yellow
$status | ForEach-Object { Write-Host "   $_" }
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray

# 3. Pedir confirmación al usuario
$confirmation = Read-Host "⚠️  ¿Autorizas subir estos cambios a GitHub? (S/N)"

if ($confirmation -eq 'S' -or $confirmation -eq 's') {
    Write-Host ""
    Write-Host "🚀 Subiendo cambios..." -ForegroundColor Cyan
    
    # Pedir mensaje de commit (opcional)
    $msg = Read-Host "📝 Mensaje del commit (Enter para usar 'Update')"
    if (-not $msg) { $msg = "Update" }

    # Ejecutar comandos Git
    git add .
    git commit -m "$msg"
    git push

    Write-Host ""
    Write-Host "✅ ¡Éxito! Los cambios están en GitHub." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "🛑 Operación cancelada. No se subió nada." -ForegroundColor Red
}
