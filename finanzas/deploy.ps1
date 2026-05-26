param(
  [switch]$Setup   # Pasar -Setup solo la primera vez para configurar nginx + SSL
)

$SERVER = "46.224.48.242"
$USER   = "root"
$DOMAIN = "mywalli.com.ar"
$EMAIL  = "fedecarini@hotmail.com"
$DIST   = "$PSScriptRoot\dist"

# ── 1. Build ──────────────────────────────────────────────────────────────────
Write-Host "==> Building..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build fallido." -ForegroundColor Red; exit 1 }

# ── 2. Setup inicial (solo con -Setup) ────────────────────────────────────────
if ($Setup) {
  Write-Host "==> Configuracion inicial de nginx + SSL..." -ForegroundColor Cyan

  $nginxConf = @"
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://`$host`$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/wallyderulo;
    index index.html;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
}
"@

  # Escribir sin BOM usando .NET directamente
  [System.IO.File]::WriteAllText("$PSScriptRoot\nginx_temp.conf", $nginxConf, [System.Text.UTF8Encoding]::new($false))

  ssh -o StrictHostKeyChecking=no "${USER}@${SERVER}" "apt-get update -qq; apt-get install -y -qq nginx certbot python3-certbot-nginx; mkdir -p /var/www/wallyderulo; rm -f /etc/nginx/sites-enabled/default"
  scp -o StrictHostKeyChecking=no "$PSScriptRoot\nginx_temp.conf" "${USER}@${SERVER}:/etc/nginx/sites-available/wallyderulo"
  Remove-Item "$PSScriptRoot\nginx_temp.conf"
  ssh -o StrictHostKeyChecking=no "${USER}@${SERVER}" "ln -sf /etc/nginx/sites-available/wallyderulo /etc/nginx/sites-enabled/wallyderulo; nginx -t && systemctl enable nginx && systemctl restart nginx"
  ssh -o StrictHostKeyChecking=no "${USER}@${SERVER}" "certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect; systemctl reload nginx"

  Write-Host "Setup completo." -ForegroundColor Green
}

# ── 3. Limpiar assets viejos y subir archivos ────────────────────────────────
Write-Host "==> Limpiando assets viejos del servidor..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${USER}@${SERVER}" "rm -rf /var/www/wallyderulo/assets"

Write-Host "==> Subiendo archivos..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no -r "${DIST}\*" "${USER}@${SERVER}:/var/www/wallyderulo/"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload fallido." -ForegroundColor Red; exit 1 }

# ── 4. Permisos + reload ──────────────────────────────────────────────────────
Write-Host "==> Aplicando permisos y recargando nginx..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${USER}@${SERVER}" "chmod -R 755 /var/www/wallyderulo/ && systemctl reload nginx && echo 'nginx recargado'"

Write-Host ""
Write-Host "Deploy completo! -> https://$DOMAIN" -ForegroundColor Green
