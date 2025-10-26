#!/bin/bash

# Oreo Media Management - Deployment Script
# Run this script on your server (167.71.201.117)

set -e

echo "🚀 Starting Oreo Media Management deployment..."

# Configuration
APP_NAME="oreo-media"
APP_DIR="/opt/oreo-media"
CDN_DIR="/var/www/oreo-cdn"
SERVICE_USER="oreo"
NGINX_SITE="oreo-media"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx postgresql-client nodejs npm pnpm

# Create service user
print_status "Creating service user..."
if ! id "$SERVICE_USER" &>/dev/null; then
    sudo useradd -r -s /bin/false -d $APP_DIR $SERVICE_USER
fi

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$SERVICE_USER $APP_DIR

# Create CDN directory
print_status "Creating CDN directory..."
sudo mkdir -p $CDN_DIR/{uploads,uploads/optimized,uploads/thumbnails,uploads/converted,uploads/batch-optimized}
sudo chown -R $SERVICE_USER:$SERVICE_USER $CDN_DIR
sudo chmod -R 755 $CDN_DIR

# Create log directory
print_status "Creating log directory..."
sudo mkdir -p /var/log/oreo
sudo chown $SERVICE_USER:$SERVICE_USER /var/log/oreo

# Copy application files (assuming you're running this from the project directory)
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install -g pnpm
pnpm install

# Build application
print_status "Building application..."
pnpm run build

# Copy production environment file
print_status "Setting up environment configuration..."
cp env.production .env

# Set proper permissions
print_status "Setting file permissions..."
sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
sudo chmod +x $APP_DIR/deploy.sh

# Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null <<EOF
[Unit]
Description=Oreo Media Management API
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3018

# Logging
StandardOutput=append:/var/log/oreo/oreo.log
StandardError=append:/var/log/oreo/oreo-error.log

[Install]
WantedBy=multi-user.target
EOF

# Configure nginx
print_status "Configuring nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/$NGINX_SITE
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

# Test nginx configuration
print_status "Testing nginx configuration..."
sudo nginx -t

# Enable and start services
print_status "Enabling and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable $APP_NAME
sudo systemctl start $APP_NAME
sudo systemctl enable nginx
sudo systemctl restart nginx

# Check service status
print_status "Checking service status..."
sleep 5
if sudo systemctl is-active --quiet $APP_NAME; then
    print_status "✅ $APP_NAME service is running"
else
    print_error "❌ $APP_NAME service failed to start"
    sudo systemctl status $APP_NAME
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx failed to start"
    sudo systemctl status nginx
    exit 1
fi

# Test API endpoint
print_status "Testing API endpoint..."
sleep 10
if curl -f http://167.71.201.117:3018/health > /dev/null 2>&1; then
    print_status "✅ API is responding"
else
    print_warning "⚠️  API health check failed, but service might still be starting up"
fi

# Display final information
print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service Information:"
echo "   • Application: http://167.71.201.117:3018"
echo "   • API Documentation: http://167.71.201.117:3018/api"
echo "   • Media Files: http://167.71.201.117/uploads/"
echo "   • CDN Directory: $CDN_DIR"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs: sudo journalctl -u $APP_NAME -f"
echo "   • Restart service: sudo systemctl restart $APP_NAME"
echo "   • Check status: sudo systemctl status $APP_NAME"
echo "   • View nginx logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "📁 Directory Structure:"
echo "   • App Directory: $APP_DIR"
echo "   • CDN Directory: $CDN_DIR"
echo "   • Logs: /var/log/oreo/"
echo ""
print_status "Deployment script completed!"
