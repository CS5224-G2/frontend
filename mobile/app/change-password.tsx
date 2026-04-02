import RequireAuth from '@/app/RequireAuth';
import ChangePasswordPage from '@/app/pages/ChangePasswordPage';

export default function ChangePasswordRoute() {
  return (
    <RequireAuth>
      <ChangePasswordPage />
    </RequireAuth>
  );
}
