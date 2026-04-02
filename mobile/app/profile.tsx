import RequireAuth from '@/app/RequireAuth';
import UserProfilePage from '@/app/pages/UserProfilePage';

export default function ProfileRoute() {
  return (
    <RequireAuth>
      <UserProfilePage />
    </RequireAuth>
  );
}
