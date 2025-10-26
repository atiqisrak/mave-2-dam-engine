-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO');

-- CreateEnum
CREATE TYPE "public"."MediaStatus" AS ENUM ('PENDING', 'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."ProcessingStage" AS ENUM ('UPLOADED', 'VALIDATING', 'PROCESSING', 'OPTIMIZING', 'GENERATING_VARIANTS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."OptimizationType" AS ENUM ('THUMBNAIL', 'COMPRESSED', 'RESIZED', 'FORMAT_CONVERTED', 'WATERMARKED', 'WEBP_CONVERTED', 'AVIF_CONVERTED');

-- CreateEnum
CREATE TYPE "public"."VariantType" AS ENUM ('THUMBNAIL', 'SMALL', 'MEDIUM', 'LARGE', 'ORIGINAL', 'WEB_OPTIMIZED', 'MOBILE_OPTIMIZED');

-- CreateEnum
CREATE TYPE "public"."UploadSessionStatus" AS ENUM ('INITIATED', 'UPLOADING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."TagSource" AS ENUM ('MANUAL', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ConfigType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY');

-- CreateEnum
CREATE TYPE "public"."ConfigCategory" AS ENUM ('GENERAL', 'DATABASE', 'STORAGE', 'SECURITY', 'UPLOAD', 'MEDIA_PROCESSING', 'NGINX', 'CLOUD_STORAGE', 'RATE_LIMITING', 'LOGGING', 'MONITORING');

-- CreateEnum
CREATE TYPE "public"."PermissionType" AS ENUM ('READ', 'WRITE', 'DELETE', 'MANAGE', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "originalName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "cdnUrl" TEXT,
    "mediaType" "public"."MediaType" NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "format" TEXT,
    "orientation" INTEGER,
    "altText" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "checksum" TEXT,
    "status" "public"."MediaStatus" NOT NULL DEFAULT 'PENDING',
    "processingStage" "public"."ProcessingStage" NOT NULL DEFAULT 'UPLOADED',
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    "associatedProduct" TEXT,
    "usageRights" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadSessionId" TEXT,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "totalFileSize" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksum" TEXT,
    "status" "public"."UploadSessionStatus" NOT NULL DEFAULT 'INITIATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload_chunks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chunkNumber" INTEGER NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "chunkData" TEXT NOT NULL,
    "checksum" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mediaId" TEXT,

    CONSTRAINT "upload_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_optimizations" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "optimizationType" "public"."OptimizationType" NOT NULL,
    "quality" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_variants" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "variantType" "public"."VariantType" NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "filePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "fileSize" INTEGER NOT NULL,
    "quality" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_tags" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" "public"."TagSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."configurations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "public"."ConfigType" NOT NULL DEFAULT 'STRING',
    "category" "public"."ConfigCategory" NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "parentId" TEXT,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."access_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_permissions" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "public"."PermissionType" NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "media_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."folder_permissions" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "public"."PermissionType" NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "folder_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "media_uploadSessionId_key" ON "public"."media"("uploadSessionId");

-- CreateIndex
CREATE INDEX "media_uploadedBy_idx" ON "public"."media"("uploadedBy");

-- CreateIndex
CREATE INDEX "media_mediaType_idx" ON "public"."media"("mediaType");

-- CreateIndex
CREATE INDEX "media_status_idx" ON "public"."media"("status");

-- CreateIndex
CREATE INDEX "media_uploadDate_idx" ON "public"."media"("uploadDate");

-- CreateIndex
CREATE INDEX "media_checksum_idx" ON "public"."media"("checksum");

-- CreateIndex
CREATE INDEX "media_folderId_idx" ON "public"."media"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "upload_sessions_sessionToken_key" ON "public"."upload_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "upload_sessions_sessionToken_idx" ON "public"."upload_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "upload_sessions_userId_idx" ON "public"."upload_sessions"("userId");

-- CreateIndex
CREATE INDEX "upload_sessions_expiresAt_idx" ON "public"."upload_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "upload_chunks_sessionId_chunkNumber_idx" ON "public"."upload_chunks"("sessionId", "chunkNumber");

-- CreateIndex
CREATE UNIQUE INDEX "upload_chunks_sessionId_chunkNumber_key" ON "public"."upload_chunks"("sessionId", "chunkNumber");

-- CreateIndex
CREATE INDEX "media_optimizations_mediaId_idx" ON "public"."media_optimizations"("mediaId");

-- CreateIndex
CREATE INDEX "media_optimizations_optimizationType_idx" ON "public"."media_optimizations"("optimizationType");

-- CreateIndex
CREATE INDEX "media_variants_mediaId_idx" ON "public"."media_variants"("mediaId");

-- CreateIndex
CREATE INDEX "media_variants_variantType_idx" ON "public"."media_variants"("variantType");

-- CreateIndex
CREATE INDEX "media_tags_mediaId_idx" ON "public"."media_tags"("mediaId");

-- CreateIndex
CREATE INDEX "media_tags_tag_idx" ON "public"."media_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "configurations_key_key" ON "public"."configurations"("key");

-- CreateIndex
CREATE INDEX "configurations_category_idx" ON "public"."configurations"("category");

-- CreateIndex
CREATE INDEX "configurations_key_idx" ON "public"."configurations"("key");

-- CreateIndex
CREATE UNIQUE INDEX "folders_path_key" ON "public"."folders"("path");

-- CreateIndex
CREATE INDEX "folders_ownerId_idx" ON "public"."folders"("ownerId");

-- CreateIndex
CREATE INDEX "folders_path_idx" ON "public"."folders"("path");

-- CreateIndex
CREATE INDEX "folders_parentId_idx" ON "public"."folders"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "access_tokens_token_key" ON "public"."access_tokens"("token");

-- CreateIndex
CREATE INDEX "access_tokens_userId_idx" ON "public"."access_tokens"("userId");

-- CreateIndex
CREATE INDEX "access_tokens_token_idx" ON "public"."access_tokens"("token");

-- CreateIndex
CREATE INDEX "access_tokens_expiresAt_idx" ON "public"."access_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "media_permissions_mediaId_idx" ON "public"."media_permissions"("mediaId");

-- CreateIndex
CREATE INDEX "media_permissions_userId_idx" ON "public"."media_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "media_permissions_mediaId_userId_key" ON "public"."media_permissions"("mediaId", "userId");

-- CreateIndex
CREATE INDEX "folder_permissions_folderId_idx" ON "public"."folder_permissions"("folderId");

-- CreateIndex
CREATE INDEX "folder_permissions_userId_idx" ON "public"."folder_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "folder_permissions_folderId_userId_key" ON "public"."folder_permissions"("folderId", "userId");

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "public"."upload_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_sessions" ADD CONSTRAINT "upload_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_chunks" ADD CONSTRAINT "upload_chunks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."upload_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_chunks" ADD CONSTRAINT "upload_chunks_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_optimizations" ADD CONSTRAINT "media_optimizations_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_variants" ADD CONSTRAINT "media_variants_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_tags" ADD CONSTRAINT "media_tags_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_tokens" ADD CONSTRAINT "access_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_permissions" ADD CONSTRAINT "media_permissions_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_permissions" ADD CONSTRAINT "media_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folder_permissions" ADD CONSTRAINT "folder_permissions_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folder_permissions" ADD CONSTRAINT "folder_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
