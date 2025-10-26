import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Niloy@Niil9', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'oreo@jerry.com' },
    update: {},
    create: {
      email: 'oreo@jerry.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@jerry.com' },
    update: {},
    create: {
      email: 'user@jerry.com',
      password: userPassword,
      role: 'USER',
    },
  });

  // Create sample media
  const sampleMedia = await prisma.media.createMany({
    data: [
      {
        title: 'Sample Product Image',
        originalName: 'product-sample.jpg',
        storedFileName: 'product-sample-123.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        filePath: '/uploads/samples/product-sample-123.jpg',
        publicUrl: 'https://cdn.jerry.com/samples/product-sample-123.jpg',
        mediaType: 'IMAGE',
        width: 1920,
        height: 1080,
        altText: 'Sample product image for demonstration',
        description: 'A high-quality sample image showing product details',
        status: 'COMPLETED',
        processingStage: 'COMPLETED',
        uploadedBy: adminUser.id,
        isPublic: true,
      },
      {
        title: 'Company Logo',
        originalName: 'logo.png',
        storedFileName: 'logo-456.png',
        mimeType: 'image/png',
        fileSize: 512000,
        filePath: '/uploads/branding/logo-456.png',
        publicUrl: 'https://cdn.jerry.com/branding/logo-456.png',
        mediaType: 'IMAGE',
        width: 800,
        height: 600,
        altText: 'Company logo',
        description: 'Official company logo in PNG format',
        status: 'COMPLETED',
        processingStage: 'COMPLETED',
        uploadedBy: adminUser.id,
        isPublic: true,
      },
      {
        title: 'Product Video Demo',
        originalName: 'product-demo.mp4',
        storedFileName: 'product-demo-789.mp4',
        mimeType: 'video/mp4',
        fileSize: 52428800, // 50MB
        filePath: '/uploads/videos/product-demo-789.mp4',
        publicUrl: 'https://cdn.jerry.com/videos/product-demo-789.mp4',
        mediaType: 'VIDEO',
        width: 1920,
        height: 1080,
        duration: 120, // 2 minutes
        format: 'H.264',
        altText: 'Product demonstration video',
        description: 'A comprehensive video showing product features and usage',
        status: 'COMPLETED',
        processingStage: 'COMPLETED',
        uploadedBy: regularUser.id,
        isPublic: true,
      },
    ],
    skipDuplicates: true,
  });

  // Create media variants
  const mediaItems = await prisma.media.findMany({
    where: { mediaType: 'IMAGE' },
    take: 2,
  });

  for (const media of mediaItems) {
    await prisma.mediaVariant.createMany({
      data: [
        {
          mediaId: media.id,
          variantType: 'THUMBNAIL',
          width: 150,
          height: 150,
          filePath: `/uploads/variants/${media.id}-thumb.jpg`,
          publicUrl: `https://cdn.jerry.com/variants/${media.id}-thumb.jpg`,
          fileSize: 25600,
          quality: 80,
          format: 'JPEG',
        },
        {
          mediaId: media.id,
          variantType: 'MEDIUM',
          width: 800,
          height: 600,
          filePath: `/uploads/variants/${media.id}-medium.jpg`,
          publicUrl: `https://cdn.jerry.com/variants/${media.id}-medium.jpg`,
          fileSize: 128000,
          quality: 85,
          format: 'JPEG',
        },
        {
          mediaId: media.id,
          variantType: 'WEB_OPTIMIZED',
          width: 1200,
          height: 900,
          filePath: `/uploads/variants/${media.id}-web.jpg`,
          publicUrl: `https://cdn.jerry.com/variants/${media.id}-web.jpg`,
          fileSize: 256000,
          quality: 90,
          format: 'JPEG',
        },
      ],
      skipDuplicates: true,
    });
  }

  // Create media tags
  for (const media of mediaItems) {
    await prisma.mediaTag.createMany({
      data: [
        {
          mediaId: media.id,
          tag: 'sample',
          confidence: 1.0,
          source: 'SYSTEM',
        },
        {
          mediaId: media.id,
          tag: 'product',
          confidence: 0.95,
          source: 'AI',
        },
        {
          mediaId: media.id,
          tag: 'high-quality',
          confidence: 0.9,
          source: 'AI',
        },
      ],
      skipDuplicates: true,
    });
  }

  // Create media optimizations
  for (const media of mediaItems) {
    await prisma.mediaOptimization.createMany({
      data: [
        {
          mediaId: media.id,
          optimizationType: 'COMPRESSED',
          quality: 85,
          fileSize: 512000,
          filePath: `/uploads/optimized/${media.id}-compressed.jpg`,
          publicUrl: `https://cdn.jerry.com/optimized/${media.id}-compressed.jpg`,
          width: 1920,
          height: 1080,
          format: 'JPEG',
          processingTime: 1500,
        },
        {
          mediaId: media.id,
          optimizationType: 'WEBP_CONVERTED',
          quality: 90,
          fileSize: 384000,
          filePath: `/uploads/optimized/${media.id}-webp.webp`,
          publicUrl: `https://cdn.jerry.com/optimized/${media.id}-webp.webp`,
          width: 1920,
          height: 1080,
          format: 'WEBP',
          processingTime: 2000,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`👤 Created ${adminUser ? 1 : 0} admin user`);
  console.log(`👤 Created ${regularUser ? 1 : 0} regular user`);
  console.log(`📸 Created ${sampleMedia.count} sample media items`);
  console.log(`🔄 Created media variants, tags, and optimizations`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
