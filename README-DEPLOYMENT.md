# Oreo Media Management - Server Deployment Guide

This guide will help you deploy the Oreo Media Management platform on your server (167.71.201.117) with proper file storage configuration.

## Prerequisites

- Ubuntu/Debian server (167.71.201.117)
- Root or sudo access
- PostgreSQL database access (already configured)
- Domain or IP access to the server

## Quick Deployment

1. **Upload the project to your server:**

   ```bash
   # On your local machine
   scp -r /path/to/oreo user@167.71.201.117:/tmp/oreo-media
   ```

2. **SSH into your server:**

   ```bash
   ssh user@167.71.201.117
   ```

3. **Run the deployment script:**
   ```bash
   cd /tmp/oreo-media
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx postgresql-client nodejs npm pnpm

# Create service user
sudo useradd -r -s /bin/false -d /opt/oreo-media oreo
```

### 2. Directory Setup

```bash
# Create application directory
sudo mkdir -p /opt/oreo-media
sudo chown $USER:oreo /opt/oreo-media

# Create CDN directory structure
sudo mkdir -p /var/www/oreo-cdn/{uploads,uploads/optimized,uploads/thumbnails,uploads/converted,uploads/batch-optimized}
sudo chown -R oreo:oreo /var/www/oreo-cdn
sudo chmod -R 755 /var/www/oreo-cdn

# Create log directory
sudo mkdir -p /var/log/oreo
sudo chown oreo:oreo /var/log/oreo
```

### 3. Application Setup

```bash
# Copy application files
cp -r . /opt/oreo-media/
cd /opt/oreo-media

# Install dependencies
pnpm install

# Build application
pnpm run build

# Copy production environment
cp env.production .env
```

### 4. Systemd Service

Create `/etc/systemd/system/oreo-media.service`:

```ini
[Unit]
Description=Oreo Media Management API
After=network.target

[Service]
Type=simple
User=oreo
WorkingDirectory=/opt/oreo-media
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
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/oreo-media`:

```nginx
server {
    listen 80;
    server_name 167.71.201.117;

    # Media files
    location /uploads/ {
        alias /var/www/oreo-cdn/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3018;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3018;
        access_log off;
    }
}
```

### 6. Enable Services

```bash
# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable oreo-media
sudo systemctl start oreo-media
sudo systemctl enable nginx
sudo systemctl restart nginx

# Test nginx configuration
sudo nginx -t
```

## Configuration Details

### Environment Variables

The production environment is configured with:

- **Upload Directory**: `/var/www/oreo-cdn/uploads`
- **Database**: PostgreSQL on 167.71.201.117:5432
- **Port**: 3018
- **CORS**: Enabled for all origins
- **File Size Limit**: 50MB
- **Cache**: 1 year for static files

### Directory Structure

```
/var/www/oreo-cdn/
├── uploads/                 # Main upload directory
│   ├── optimized/          # Optimized images
│   ├── thumbnails/         # Generated thumbnails
│   ├── converted/          # Format converted files
│   └── batch-optimized/    # Batch processed files
```

### API Endpoints

- **API Base**: `http://167.71.201.117:3018/api/v1`
- **Documentation**: `http://167.71.201.117:3018/api`
- **Health Check**: `http://167.71.201.117:3018/health`
- **Media Files**: `http://167.71.201.117/uploads/`

## Management Commands

### Service Management

```bash
# Check service status
sudo systemctl status oreo-media

# View logs
sudo journalctl -u oreo-media -f

# Restart service
sudo systemctl restart oreo-media

# Stop service
sudo systemctl stop oreo-media
```

### Log Files

```bash
# Application logs
sudo tail -f /var/log/oreo/oreo.log

# Error logs
sudo tail -f /var/log/oreo/oreo-error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### File Management

```bash
# Check disk usage
du -sh /var/www/oreo-cdn/

# List uploaded files
ls -la /var/www/oreo-cdn/uploads/

# Clean up old files (if needed)
find /var/www/oreo-cdn/uploads/ -type f -mtime +30 -delete
```

## Security Considerations

1. **File Permissions**: Ensure proper ownership and permissions
2. **Nginx Security**: Configure proper security headers
3. **Database Security**: Use strong passwords and restrict access
4. **Firewall**: Configure UFW or iptables for port access
5. **SSL**: Consider adding SSL certificates for production

## Troubleshooting

### Common Issues

1. **Service won't start**: Check logs with `sudo journalctl -u oreo-media -f`
2. **Permission denied**: Ensure proper ownership with `sudo chown -R oreo:oreo /var/www/oreo-cdn`
3. **Database connection**: Verify DATABASE_URL in .env file
4. **Port conflicts**: Check if port 3018 is available with `sudo netstat -tlnp | grep 3018`

### Health Checks

```bash
# Test API health
curl http://167.71.201.117:3018/health

# Test file upload
curl -X POST http://167.71.201.117:3018/api/v1/upload \
  -F "file=@test.jpg" \
  -F "userId=test-user"

# Test file access
curl http://167.71.201.117/uploads/test-file.jpg
```

## Monitoring

### System Resources

```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check CPU usage
top

# Check network connections
netstat -tlnp
```

### Application Metrics

- Monitor log files for errors
- Check database connection status
- Monitor file upload success rates
- Track API response times

## Backup Strategy

1. **Database**: Regular PostgreSQL backups
2. **Files**: Backup `/var/www/oreo-cdn/` directory
3. **Configuration**: Backup nginx and systemd configs
4. **Logs**: Archive old log files

## Updates and Maintenance

1. **Code Updates**: Pull latest changes and rebuild
2. **Dependencies**: Regular `pnpm update`
3. **System Updates**: Regular `apt update && apt upgrade`
4. **Log Rotation**: Configure logrotate for log files

---

For support or questions, check the application logs or contact the development team.
