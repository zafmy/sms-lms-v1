# Clerk Setup for SchooLama

## 1. API Keys

Add to `.env`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Get keys at: https://dashboard.clerk.com/last-active?path=api-keys

## 2. Session Token – Include Role (Required for middleware)

The app uses `sessionClaims.metadata.role` for role-based access. Add this to your session token:

1. In **Clerk Dashboard** → **Sessions** → **Customize session token**
2. In the **Claims** editor, add:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

3. Save

Without this, the middleware cannot read the role and redirects will fail.

## 3. Create Admin User

1. **Clerk Dashboard** → **Users** → **Create user**
2. Set username and password
3. In **Public metadata**, add:

```json
{
  "role": "admin"
}
```

4. Save

## 4. Username vs Email

The sign-in form uses an "identifier" field. In **Clerk Dashboard** → **User & Authentication** → **Email, Phone, Username**, enable **Username** if you want username-based sign-in.
