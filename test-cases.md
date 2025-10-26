# Oreo Media Management System - Test Cases

## Test Environment

- **Base URL**: `http://localhost:3018/api/v1`
- **Server Status**: ✅ Running

## Authentication & Authorization Tests

### 1. User Authentication

- [ ] **Test 1.1**: Register a new user
- [ ] **Test 1.2**: Login with valid credentials
- [ ] **Test 1.3**: Login with invalid credentials
- [ ] **Test 1.4**: Get user profile with valid token
- [ ] **Test 1.5**: Get user profile without token (should fail)

### 2. Access Token Management (Admin Only)

- [ ] **Test 2.1**: Create access token (Admin user)
- [ ] **Test 2.2**: List access tokens
- [ ] **Test 2.3**: Get specific access token
- [ ] **Test 2.4**: Update access token
- [ ] **Test 2.5**: Deactivate access token
- [ ] **Test 2.6**: Reactivate access token
- [ ] **Test 2.7**: Delete access token
- [ ] **Test 2.8**: Create access token (Non-admin user - should fail)

## Folder Management Tests

### 3. Folder CRUD Operations

- [ ] **Test 3.1**: Create root folder
- [ ] **Test 3.2**: Create nested folder
- [ ] **Test 3.3**: List all accessible folders
- [ ] **Test 3.4**: Get specific folder details
- [ ] **Test 3.5**: Update folder properties
- [ ] **Test 3.6**: Delete empty folder
- [ ] **Test 3.7**: Delete folder with media (should fail)
- [ ] **Test 3.8**: Delete folder with subfolders (should fail)

### 4. Folder Permissions

- [ ] **Test 4.1**: Grant folder permission to user
- [ ] **Test 4.2**: Revoke folder permission from user
- [ ] **Test 4.3**: Access folder with permission
- [ ] **Test 4.4**: Access folder without permission (should fail)
- [ ] **Test 4.5**: Grant permission with expiration date

## Media Management Tests

### 5. Media Upload & Organization

- [ ] **Test 5.1**: Upload media file to root
- [ ] **Test 5.2**: Upload media file to specific folder
- [ ] **Test 5.3**: Upload public media
- [ ] **Test 5.4**: Upload private media
- [ ] **Test 5.5**: Upload with folder assignment

### 6. Media Access Control

- [ ] **Test 6.1**: List all accessible media (authenticated)
- [ ] **Test 6.2**: List public media (no auth required)
- [ ] **Test 6.3**: Get specific media details
- [ ] **Test 6.4**: Download media file
- [ ] **Test 6.5**: Access private media without permission (should fail)
- [ ] **Test 6.6**: Access media with access token

### 7. Media Permissions

- [ ] **Test 7.1**: Grant media permission to user
- [ ] **Test 7.2**: Revoke media permission from user
- [ ] **Test 7.3**: Update media properties
- [ ] **Test 7.4**: Delete media file
- [ ] **Test 7.5**: Grant permission with expiration date

### 8. Media Filtering & Search

- [ ] **Test 8.1**: Filter media by type (IMAGE, VIDEO, DOCUMENT)
- [ ] **Test 8.2**: Filter media by folder
- [ ] **Test 8.3**: Filter media by public/private status
- [ ] **Test 8.4**: Combine multiple filters

## Advanced Features Tests

### 9. Permission Inheritance

- [ ] **Test 9.1**: Media inherits folder permissions
- [ ] **Test 9.2**: Folder permission affects all media inside
- [ ] **Test 9.3**: Permission hierarchy resolution

### 10. Access Token Features

- [ ] **Test 10.1**: Access media with valid access token
- [ ] **Test 10.2**: Access media with expired access token (should fail)
- [ ] **Test 10.3**: Access media with invalid access token (should fail)
- [ ] **Test 10.4**: Access token with specific permissions

### 11. Error Handling

- [ ] **Test 11.1**: Invalid folder ID (404)
- [ ] **Test 11.2**: Invalid media ID (404)
- [ ] **Test 11.3**: Unauthorized access (401)
- [ ] **Test 11.4**: Forbidden access (403)
- [ ] **Test 11.5**: Invalid request data (400)

## Performance & Edge Cases

### 12. Large File Handling

- [ ] **Test 12.1**: Upload large image file
- [ ] **Test 12.2**: Upload large video file
- [ ] **Test 12.3**: Upload file exceeding size limit (should fail)

### 13. Concurrent Access

- [ ] **Test 13.1**: Multiple users accessing same media
- [ ] **Test 13.2**: Multiple users modifying same folder
- [ ] **Test 13.3**: Permission changes during access

## Test Results Summary

- **Total Tests**: 50
- **Passed**: 20
- **Failed**: 0
- **Not Tested**: 30

## ✅ Completed Tests

### 1. User Authentication

- [x] **Test 1.2**: Login with valid credentials ✅
- [x] **Test 1.4**: Get user profile with valid token ✅
- [x] **Test 1.5**: Get user profile without token (should fail) ✅

### 3. Folder CRUD Operations

- [x] **Test 3.1**: Create root folder ✅
- [x] **Test 3.2**: Create nested folder ✅
- [x] **Test 3.3**: List all accessible folders ✅
- [x] **Test 3.4**: Get specific folder details ✅
- [x] **Test 3.5**: Update folder properties ✅
- [x] **Test 3.7**: Delete folder with media (should fail) ✅

### 5. Media Upload & Organization

- [x] **Test 5.1**: Upload media file to root ✅
- [x] **Test 5.2**: Upload media file to specific folder ✅

### 6. Media Access Control

- [x] **Test 6.2**: List public media (no auth required) ✅
- [x] **Test 6.5**: Access private media without permission (should fail) ✅

### 7. Media Permissions

- [x] **Test 7.3**: Update media properties ✅

### 8. Media Filtering & Search

- [x] **Test 8.1**: Filter media by type (IMAGE, VIDEO, DOCUMENT) ✅
- [x] **Test 8.2**: Filter media by folder ✅
- [x] **Test 8.3**: Filter media by public/private status ✅
- [x] **Test 8.4**: Combine multiple filters ✅

### 11. Error Handling

- [x] **Test 11.1**: Invalid folder ID (404) ✅
- [x] **Test 11.2**: Invalid media ID (404) ✅

## Notes

- All tests require proper authentication tokens
- Admin tests require admin user credentials
- Some tests depend on previous test results (folder IDs, media IDs)
- Test data should be cleaned up after testing
