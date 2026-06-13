#!/usr/bin/env bash
set -e

SERVER="46.224.48.242"
USER="root"
DOMAIN="mywalli.com.ar"
DIST="$(dirname "$0")/dist"

# ── 1. Build ──────────────────────────────────────────────────────────────────
echo "==> Building..."
cd "$(dirname "$0")"
npm run build

# ── 2. Limpiar assets viejos ──────────────────────────────────────────────────
echo "==> Limpiando assets viejos del servidor..."
ssh -o StrictHostKeyChecking=no "${USER}@${SERVER}" "rm -rf /var/www/wallyderulo/assets"

# ── 3. Subir archivos ─────────────────────────────────────────────────────────
echo "==> Subiendo archivos..."
scp -o StrictHostKeyChecking=no -r "${DIST}/"* "${USER}@${SERVER}:/var/www/wallyderulo/"

# ── 4. Permisos + reload nginx ────────────────────────────────────────────────
echo "==> Aplicando permisos y recargando nginx..."
ssh -o StrictHostKeyChecking=no "${USER}@${SERVER}" \
  "chmod -R 755 /var/www/wallyderulo/ && systemctl reload nginx && echo 'nginx recargado'"

echo ""
echo "Deploy completo! -> https://${DOMAIN}"
