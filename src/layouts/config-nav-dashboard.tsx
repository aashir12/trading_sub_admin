import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationPin,
  faArchive,
  faFolder,
  faGlobe,
  faTrash,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import { IoIosNotifications } from 'react-icons/io';
import { firebaseController } from 'src/utils/firebaseMiddleware';
// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor width="100%" height="100%" src={`/assets/icons/navbar/${name}.svg`} />
);

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Users',
    path: '/user',
    icon: <FontAwesomeIcon icon={faFolder} />,
    info: (
      <Label color="error" variant="inverted">
        +1
      </Label>
    ),
  },

  {
    title: 'Withdrawal Requests',
    path: '/withdrawl-requests',
    icon: <FontAwesomeIcon icon={faFolder} />,
  },
  {
    title: 'Deposit',
    path: '/deposit',
    icon: <FontAwesomeIcon icon={faFolder} />,
  },
  {
    title: 'Notifications',
    path: '/notifications',
    icon: <IoIosNotifications size={24} />,
    info: (
      <Label color="primary" variant="inverted">
        NEW
      </Label>
    ),
  },
  {
    title: 'Support Tickets',
    path: '/support-tickets',
    icon: <FontAwesomeIcon icon={faEnvelope} />,
  },
  {
    title: 'Not found',
    path: '/404',
    icon: icon('ic-disabled'),
  },
];
