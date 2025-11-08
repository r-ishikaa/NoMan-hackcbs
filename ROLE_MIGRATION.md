# Role-Based Account System Migration

## Overview

The system has been migrated from the old role system (`student`, `hr`) to a new flexible role-based account system with three account types:
- **user** (normal user) - Default account type
- **creator** - For content creators
- **enterprise** - For enterprise/business accounts
- **admin** - System administrators (unchanged)

## Migration Details

### Role Mapping
- `student` → `user` (normal user)
- `hr` → `enterprise` (enterprise account)
- `admin` → `admin` (unchanged)

### Backward Compatibility

All existing profile data is preserved:
- `studentProfile` - Kept for backward compatibility
- `hrProfile` - Kept for backward compatibility
- `profileData` - New generic field for role-specific data

### Key Changes

#### 1. User Model (`backend/src/models/User.js`)
- Updated role enum: `["user", "creator", "enterprise", "admin"]`
- Default role changed from `"student"` to `"user"`
- Added `profileData` field for generic role-specific data
- Kept `studentProfile` and `hrProfile` for backward compatibility

#### 2. Authentication Routes (`backend/src/routes/auth.js`)
- Updated validation to accept new roles
- Default role for signup changed to `"user"`
- Google OAuth updated to support new roles
- Role validation updated in all endpoints

#### 3. User Routes (`backend/src/routes/users.js`)
- **Resume functionality**: Now available to ALL roles (not just students)
- Added new endpoint: `PUT /users/me/role` - Update user role (flexible role switching)
- Updated profile endpoint to include `profileData`
- Removed role restrictions from resume upload/download/delete endpoints

#### 4. Enrollment Model (`backend/src/models/Enrollment.js`)
- Added `userId` field (primary for new enrollments)
- Kept `studentId` for backward compatibility
- Automatic synchronization between `userId` and `studentId` via pre-validate hook
- Updated indexes to support both fields

#### 5. Enrollment Routes (`backend/src/routes/enrollments.js`)
- Updated to use `userId` primarily
- Backward compatible with `studentId` field
- All queries check both fields for maximum compatibility

#### 6. Frontend CSS (`frontend/src/index.css`)
- Added styling for new roles (`user`, `creator`, `enterprise`)
- Maintained backward compatibility with old role styles
- Creator role has purple gradient styling

## Running the Migration

To migrate existing users and data, run the migration script:

```bash
cd backend
node src/scripts/migrateRoles.js
```

This script will:
1. Convert all `student` roles to `user`
2. Convert all `hr` roles to `enterprise`
3. Update enrollments to include `userId` field
4. Display migration statistics

## New API Endpoints

### Update User Role
```
PUT /users/me/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "user" | "creator" | "enterprise"
}
```

**Response:**
```json
{
  "message": "Role updated successfully",
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "role": "creator"
  }
}
```

## Features

### Flexible Role System
- Users can switch between roles using `PUT /users/me/role`
- No data loss when switching roles
- All profile data is preserved

### Resume Functionality
- **Available to all roles** (user, creator, enterprise)
- Stored in `profileData.resume` (new) and `studentProfile.resume` (backward compatibility)
- All existing resume endpoints work for all roles

### Enrollment System
- Works with both `userId` and `studentId` fields
- Automatic field synchronization
- Backward compatible with existing enrollments

## Testing

1. **Test role switching:**
   ```bash
   PUT /users/me/role
   Body: { "role": "creator" }
   ```

2. **Test resume upload (all roles):**
   ```bash
   POST /users/upload-resume
   Form-data: resume file
   ```

3. **Test enrollment:**
   ```bash
   POST /enrollments
   Body: { "courseId": "..." }
   ```

## Notes

- All existing data is preserved
- Old role names in CSS are still supported for backward compatibility
- The migration script is safe to run multiple times (idempotent)
- Admin role remains unchanged and requires manual assignment

## Next Steps

1. Run the migration script to update existing users
2. Update frontend components to use new role names
3. Test role switching functionality
4. Update any frontend role checks to use new role names

## Support

If you encounter any issues during migration:
1. Check MongoDB connection
2. Verify environment variables
3. Review migration script logs
4. Ensure all dependencies are installed

