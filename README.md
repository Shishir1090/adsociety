# AdSociety — starter application

This is the first frontend milestone for AdSociety:
- Premium responsive public homepage
- Public marketing sections
- Three-portal login selector (Society, Brand, Admin)
- Supabase client wiring (not yet authenticated)

## Requirements
- Node.js LTS
- VS Code
- A Supabase account (optional for this first visual milestone)

## Run locally
```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173.

## Supabase setup
Create a Supabase project, then copy its Project URL and publishable/anon key into `.env.local`.
Never put the Supabase service-role key in browser code.

Authentication, database schema, KYC uploads, RLS policies, bookings and payment integration are subsequent development modules. The login screen in this starter is a UI demonstration; it does not create or authenticate accounts yet.

## Next development milestone
Implement real email/password or OTP authentication, profiles and role-based onboarding. Admin account creation must be restricted to a trusted server-side process; do not allow public admin signup.
