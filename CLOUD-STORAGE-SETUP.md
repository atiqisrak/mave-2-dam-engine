# Cloud Storage Setup Guide

This guide will help you configure the Oreo Media Management platform to use cloud storage instead of local file storage.

## Supported Cloud Providers

- **AWS S3** (Amazon Web Services)
- **Google Cloud Storage** (Coming soon)
- **Azure Blob Storage** (Coming soon)

## AWS S3 Setup

### 1. Create AWS S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `oreo-media-bucket`)
4. Select your preferred region
5. Configure public access settings:
   - Uncheck "Block all public access"
   - Check "I acknowledge that the current settings might result in this bucket and the objects within it becoming public"
6. Click "Create bucket"

### 2. Configure Bucket Policy

Add this policy to your S3 bucket to allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 3. Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Enter username: `oreo-media-service`
4. Attach policies:
   - `AmazonS3FullAccess` (or create custom policy with minimal permissions)
5. Create access key and download credentials

### 4. Environment Configuration

Copy `env.cloud` to `.env` and update the values:

```bash
cp env.cloud .env
```

Update these values in your `.env` file:

```env
# Cloud Storage Configuration
CLOUD_STORAGE_PROVIDER=aws
CLOUD_STORAGE_BUCKET=your-bucket-name
CLOUD_STORAGE_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
CLOUD_STORAGE_BASE_URL=https://your-bucket-name.s3.us-east-1.amazonaws.com
CLOUD_STORAGE_CDN_URL=https://your-cdn-domain.com  # Optional: for CDN
```

## File Organization

Files are automatically organized in your S3 bucket:

```
your-bucket-name/
├── images/
│   ├── users/
│   │   └── user-id/
│   │       └── timestamp-randomid.jpg
│   └── uploads/
│       └── timestamp-randomid.jpg
├── videos/
│   └── users/
│       └── user-id/
│           └── timestamp-randomid.mp4
└── documents/
    └── users/
        └── user-id/
            └── timestamp-randomid.pdf
```

## API Usage

### Upload File

```bash
curl -X POST http://167.71.201.117:3018/api/v1/upload \
  -F "file=@image.jpg" \
  -F "userId=user123" \
  -F "quality=80"
```

Response:

```json
{
  "id": "media-id",
  "filename": "1703123456789-abc123.jpg",
  "originalName": "image.jpg",
  "mimeType": "image/jpeg",
  "size": 1024000,
  "path": "images/users/user123/1703123456789-abc123.jpg",
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/images/users/user123/1703123456789-abc123.jpg",
  "type": "IMAGE",
  "width": 1920,
  "height": 1080,
  "status": "COMPLETED",
  "userId": "user123",
  "createdAt": "2023-12-21T10:30:00.000Z",
  "updatedAt": "2023-12-21T10:30:00.000Z"
}
```

### Get Media by ID

```bash
curl http://167.71.201.117:3018/api/v1/media/media-id
```

### Delete Media

```bash
curl -X DELETE http://167.71.201.117:3018/api/v1/media/media-id
```

## Features

### 1. Automatic File Organization

- Files are organized by type (images, videos, documents)
- User-specific folders for better organization
- Timestamp-based naming to prevent conflicts

### 2. Image Processing

- Automatic image optimization
- Thumbnail generation
- Format conversion
- Metadata extraction

### 3. Cloud Storage Benefits

- Scalable storage
- Global CDN support
- Automatic backups
- Cost-effective
- High availability

### 4. Security

- IAM-based access control
- Presigned URLs for private files
- CORS configuration
- File type validation

## CDN Configuration (Optional)

### CloudFront Setup

1. Go to [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Create distribution
3. Set origin to your S3 bucket
4. Configure caching behavior
5. Update `CLOUD_STORAGE_CDN_URL` in your environment

### Benefits of CDN

- Faster file delivery
- Reduced bandwidth costs
- Global edge locations
- Automatic compression

## Monitoring and Logs

### CloudWatch Integration

Monitor your S3 usage:

- Storage metrics
- Request metrics
- Error rates
- Cost analysis

### Application Logs

Check application logs for cloud storage operations:

```bash
# View logs
tail -f logs/oreo.log

# Check for errors
grep "cloud storage" logs/oreo.log
```

## Troubleshooting

### Common Issues

1. **Access Denied**
   - Check IAM permissions
   - Verify bucket policy
   - Ensure credentials are correct

2. **File Not Found**
   - Check if file exists in S3
   - Verify URL generation
   - Check bucket region

3. **Upload Failures**
   - Check file size limits
   - Verify network connectivity
   - Check AWS service status

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Health Check

Test cloud storage connectivity:

```bash
curl http://167.71.201.117:3018/health
```

## Cost Optimization

### S3 Storage Classes

- **Standard**: Frequently accessed data
- **IA (Infrequent Access)**: Less frequently accessed data
- **Glacier**: Archive data

### Lifecycle Policies

Set up automatic transitions:

- Move old files to IA after 30 days
- Move to Glacier after 90 days
- Delete after 1 year

## Security Best Practices

1. **IAM Policies**: Use least privilege principle
2. **Bucket Policies**: Restrict public access where possible
3. **Encryption**: Enable server-side encryption
4. **Access Logging**: Enable S3 access logging
5. **Versioning**: Enable versioning for important files

## Migration from Local Storage

If you're migrating from local storage:

1. **Backup existing files**
2. **Update environment configuration**
3. **Test with a few files first**
4. **Gradually migrate all files**
5. **Update your frontend URLs**

## Support

For issues or questions:

- Check AWS S3 documentation
- Review application logs
- Test with AWS CLI
- Contact development team

---

Your media files are now stored in the cloud and accessible via public URLs! 🚀
