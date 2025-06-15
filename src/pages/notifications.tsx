import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { NotificationsView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Notifications - ${CONFIG.appName}`}</title>
      </Helmet>

      <NotificationsView />
    </>
  );
}
