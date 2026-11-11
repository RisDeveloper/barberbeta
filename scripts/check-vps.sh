#!/usr/bin/env bash
# ============================================================================
# Diagnostic script for BarberStory VPS
# Usage: sudo bash check-vps.sh
# ============================================================================
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "========================================"
echo "  BarberStory VPS Diagnostic"
echo "========================================"
echo ""

# 1. System info
echo "--- System ---"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo "Uptime: $(uptime -p)"
echo "RAM: $(free -h | awk '/^Mem:/{print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $3 "/" $2 " (" $5 " used)"}')"
echo "Swap: $(free -h | awk '/^Swap:/{print $3 "/" $2}')"
echo ""

# 2. Node.js
echo "--- Node.js ---"
if command -v node &>/dev/null; then
  ok "Node.js $(node -v)"
else
  fail "Node.js NOT installed"
fi
if command -v npm &>/dev/null; then
  ok "npm $(npm -v)"
else
  fail "npm NOT installed"
fi
echo ""

# 3. PM2
echo "--- PM2 ---"
if command -v pm2 &>/dev/null; then
  ok "PM2 installed ($(pm2 -v))"
  pm2 status 2>/dev/null || warn "PM2 no processes"
  echo ""
  echo "Recent PM2 logs:"
  pm2 logs barberstory --lines 20 --nostream 2>/dev/null || warn "No PM2 logs"
else
  fail "PM2 NOT installed — run: npm i -g pm2"
fi
echo ""

# 4. Port 3000
echo "--- Port 3000 ---"
if ss -tlnp | grep -q ':3000'; then
  ok "Port 3000 is listening"
  ss -tlnp | grep ':3000'
else
  fail "Port 3000 NOT listening — app not running"
fi
echo ""

# 5. Nginx
echo "--- Nginx ---"
if command -v nginx &>/dev/null; then
  ok "Nginx installed ($(nginx -v 2>&1))"
  if systemctl is-active --quiet nginx; then
    ok "Nginx running"
  else
    fail "Nginx NOT running — run: systemctl start nginx"
  fi
  if nginx -t 2>&1 | grep -q "syntax is ok"; then
    ok "Nginx config valid"
  else
    fail "Nginx config INVALID:"
    nginx -t 2>&1
  fi
else
  fail "Nginx NOT installed — run: apt install -y nginx"
fi
echo ""

# 6. PostgreSQL
echo "--- PostgreSQL ---"
if command -v psql &>/dev/null; then
  ok "PostgreSQL client installed"
else
  warn "psql not found (might be using managed DB — OK)"
fi
if systemctl is-active --quiet postgresql 2>/dev/null; then
  ok "PostgreSQL running locally"
  sudo -u postgres psql -c "\du" 2>/dev/null | head -5 || true
else
  warn "PostgreSQL not running locally (OK if using managed DB)"
fi
echo ""

# 7. .env file
echo "--- .env ---"
if [ -f /var/www/barberstory/.env ]; then
  ok ".env exists"
  # Check required vars (mask values)
  for var in DATABASE_URL DIRECT_URL AUTH_URL NEXT_PUBLIC_AUTH_URL COOKIE_DOMAIN; do
    if grep -q "^$var=" /var/www/barberstory/.env; then
      ok "  $var set"
    else
      fail "  $var MISSING"
    fi
  done
  # Check for placeholder
  if grep -q "domainlu.com" /var/www/barberstory/.env; then
    fail "  Still contains placeholder 'domainlu.com' — update .env!"
  fi
else
  fail ".env NOT found — create it first"
fi
echo ""

# 8. App directory
echo "--- App ---"
if [ -d /var/www/barberstory ]; then
  ok "App directory exists"
  if [ -f /var/www/barberstory/package.json ]; then
    ok "package.json found"
  else
    fail "package.json NOT found — clone incomplete"
  fi
  if [ -d /var/www/barberstory/node_modules ]; then
    ok "node_modules installed"
  else
    fail "node_modules NOT installed — run: npm ci"
  fi
  if [ -d /var/www/barberstory/.next ]; then
    ok "Build exists (.next)"
  else
    fail "No build (.next) — run: npm run build"
  fi
  if [ -f /var/www/barberstory/.env ]; then
    ok ".env present in app dir"
  fi
else
  fail "App directory NOT found — run: git clone ..."
fi
echo ""

# 9. DNS
echo "--- DNS ---"
DOMAIN=$(grep "^AUTH_URL=" /var/www/barberstory/.env 2>/dev/null | sed 's|.*https://||' | tr -d '"')
if [ -n "$DOMAIN" ]; then
  echo "Domain: $DOMAIN"
  if nslookup "$DOMAIN" &>/dev/null; then
    IP=$(nslookup "$DOMAIN" 2>/dev/null | grep -A1 "Name:" | tail -1 | awk '{print $2}')
    ok "DNS resolves to $IP"
    VPS_IP=$(hostname -I | awk '{print $1}')
    if [ "$IP" = "$VPS_IP" ]; then
      ok "DNS points to this VPS ($VPS_IP)"
    else
      warn "DNS IP ($IP) != VPS IP ($VPS_IP) — check A record"
    fi
  else
    fail "DNS not resolving — check domain & A record"
  fi
else
  fail "Cannot read domain from .env"
fi
echo ""

# 10. SSL
echo "--- SSL ---"
if [ -d /etc/letsencrypt/live ]; then
  CERT=$(ls /etc/letsencrypt/live/ 2>/dev/null | head -1)
  if [ -n "$CERT" ]; then
    ok "SSL certificate found: $CERT"
    openssl x509 -in /etc/letsencrypt/live/$CERT/fullchain.pem -noout -dates 2>/dev/null || true
  else
    warn "No SSL certificate — run: certbot --nginx -d $DOMAIN"
  fi
else
  warn "Let's Encrypt not configured"
fi
echo ""

# 11. HTTP test
echo "--- HTTP Test ---"
if command -v curl &>/dev/null; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    ok "App responds on localhost:3000 (HTTP $STATUS)"
  else
    fail "App NOT responding on localhost:3000 (HTTP $STATUS)"
  fi
  # External test
  EXT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN" 2>/dev/null || echo "000")
  if [ "$EXT_STATUS" = "200" ]; then
    ok "External HTTPS responds (HTTP $EXT_STATUS)"
  elif [ "$EXT_STATUS" = "000" ]; then
    warn "External test failed (DNS/SSL not ready yet?)"
  else
    warn "External HTTPS returned HTTP $EXT_STATUS"
  fi
else
  warn "curl not installed"
fi
echo ""

# 12. DB connection test
echo "--- Database ---"
if [ -f /var/www/barberstory/.env ]; then
  DB_URL=$(grep "^DATABASE_URL=" /var/www/barberstory/.env | cut -d= -f2- | tr -d '"')
  if echo "$DB_URL" | grep -q "localhost"; then
    # Local DB — test with psql
    if command -v psql &>/dev/null; then
      if sudo -u postgres psql -c "SELECT 1" &>/dev/null; then
        ok "Local PostgreSQL responding"
      else
        fail "Local PostgreSQL NOT responding"
      fi
    fi
  else
    # Remote DB — test with node
    warn "Remote DB detected — test connection manually:"
    echo "  node -e \"const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRaw\`SELECT 1\`.then(()=>{console.log('DB OK');p.\$disconnect()}).catch(e=>{console.error(e.message);process.exit(1)})\""
  fi
fi
echo ""

echo "========================================"
echo "  Diagnostic complete"
echo "========================================"