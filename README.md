# At 116 & Broadway: Admin

Admin area for the At 116 & Broadway caption-voting app (Week 6).

- **Dashboard**: stats from the live database (votes per day, busiest hours, crowd favorites, most divisive captions, voter personalities, short vs long captions, models used).
- **AI media**: create, read, update and delete photos and AI captions.
- **Users**: read all profiles.
- **Votes**: read all upvotes and downvotes.

## Security

Three layers, so nothing is exposed even if one fails:

1. `proxy.ts` sends anyone not logged in with Google to `/login`, and anyone whose `profiles.is_superadmin` is not `true` to `/not-allowed`.
2. Every page and server action calls `requireAdmin()` again on the server.
3. Supabase Row Level Security: only superadmins can read all profiles and votes or change captions. Normal users can't change `is_superadmin` (column-level grants only allow name and photo edits).

## "Won't I be locked out?"

The first admin is set directly in the Supabase SQL editor, which runs as the database owner and bypasses RLS:

```sql
update public.profiles set is_superadmin = true where email = 'you@columbia.edu';
```

After that, admins can be added the same way. Nobody can promote themselves from the app.
