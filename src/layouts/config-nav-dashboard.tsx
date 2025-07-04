import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationPin,
  faArchive,
  faFolder,
  faGlobe,
  faTrash,
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
    title: 'Archive',
    path: '/archive-list',
    icon: <FontAwesomeIcon icon={faArchive} />,
    info: (
      <Label color="error" variant="inverted">
        +2
      </Label>
    ),
    actions: [
      {
        icon: <FontAwesomeIcon icon={faTrash} />,
        onClick: async (id: string) => {
          try {
            await firebaseController.deleteAdminEntry(id);
            console.log('User entry deleted successfully');
          } catch (error) {
            console.error('Error deleting user entry:', error);
          }
        },
      },
    ],
  },

  {
    title: 'Not found',
    path: '/404',
    icon: icon('ic-disabled'),
  },
];
