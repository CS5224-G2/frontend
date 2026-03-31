import RequireAuth from '@/app/RequireAuth';
import EditProfilePage from '@/app/pages/EditProfilePage';

export default function EditProfileRoute() {
  return (
    <RequireAuth>
      <EditProfilePage />
    </RequireAuth>
  );
}
