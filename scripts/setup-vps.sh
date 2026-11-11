#!/usr/bin/env bash
# ============================================================================
# Setup script for deploying BarberStory (Next.js) to a VPS (Ubuntu/Debian)
# Usage: sudo bash setup-vps.sh
# Assumes: VPS with Ubuntu 22.04/24.04, root access, domain pointed to VPS IP
# ============================================================================
set -euo pipefail

# ---------- CONFIG (edit these) ----------
DOMAIN="domainlu.com"              # your domain, e.g. barberbeta.com
REPO="https://github.com/RisDeveloper/barberbeta.git"
APP_DIR="/var/www/barberstory"
NODE_VERSION="20"
DB_URL="postgresql://user:pass@host:5432/dbname?schema=public"   # managed PostgreSQL connection string
# ----------------------------------------

echo "==> Updating system..."
apt update && apt upgrade -y

echo "==> Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

echo "==> Installing PM2, Nginx, Certbot..."
npm i -g pm2
apt install -y nginx certbot python3-certbot-nginx git

echo "==> Enabling swap (2GB) for build stability..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Creating app directory..."
mkdir -p "$APP_DIR"
chown -R $SUDO_USER:$SUDO_USER "$APP_DIR" 2>/dev/null || true

echo "==> Cloning repo..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> Writing .env..."
cat > .env <<EOF
DATABASE_URL="$DB_URL"
DIRECT_URL="$DB_URL"
AUTH_URL="https://$DOMAIN"
NEXT_PUBLIC_AUTH_URL="https://$DOMAIN"
COOKIE_DOMAIN="$DOMAIN"
COOKIE_SECURE="true"
DEFAULT_TZ="Asia/Jakarta"
PORTAL_OWNER_URL="https://$DOMAIN/owner"
PORTAL_ADMIN_URL="https://$DOMAIN/admin"
PORTAL_CASHIER_URL="https://$DOMAIN/cashier"
PORTAL_EMPLOYEE_URL="https://$DOMAIN/employee"
EOF

echo "==> Installing dependencies..."
npm ci

echo "==> Running database migrations..."
npx prisma migrate deploy
npx prisma generate

echo "==> Building app..."
npm run build

echo "==> Starting app with PM2..."
pm2 delete barberstory 2>/dev/null || true
pm2 start npm --name barberstory -- start
pm2 save
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER 2>/dev/null || pm2 startup systemd -u root --hp /root

echo "==> Configuring Nginx..."
cat > /etc/nginx/sites-available/barberstory <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/barberstory /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "==> Setting up SSL (Let's Encrypt)..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || echo "SSL setup failed — run manually: certbot --nginx -d $DOMAIN"

echo ""
echo "========================================"
echo "  Setup complete!"
echo "  App running on: https://$DOMAIN"
echo "  PM2 status: pm2 status"
echo "  Logs: pm2 logs barberstory"
echo "  Restart: pm2 restart barberstory"
echo "========================================"
EOF
echo "Script created at scripts/setup-vps.sh"