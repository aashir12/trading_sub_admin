import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { CONFIG } from 'src/config-global';
import { NotificationsView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export default function Page() {
  const location = useLocation();
  // Accept preselectedUsers from location.state
  const preselectedUsers = location.state?.preselectedUsers || [];
  return (
    <>
      <Helmet>
        <title> {`Notifications - ${CONFIG.appName}`}</title>
      </Helmet>
      <NotificationsView preselectedUsers={preselectedUsers} />
    </>
  );
}
