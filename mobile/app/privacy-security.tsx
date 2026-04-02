import RequireAuth from '@/app/RequireAuth';
import PrivacySecurityPage from '@/app/pages/PrivacySecurityPage';

export default function PrivacySecurityRoute() {
  return (
    <RequireAuth>
      <PrivacySecurityPage />
    </RequireAuth>
  );
}
