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
    title: 'Location',
    path: '/map-list',
    icon: <FontAwesomeIcon icon={faLocationPin} />,
    info: (
      <Label color="error" variant="inverted">
        +2
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
            await firebaseController.deleteArchiveEntry(id);
            console.log('Archive entry deleted successfully');
          } catch (error) {
            console.error('Error deleting archive entry:', error);
          }
        },
      },
    ],
  },
  {
    title: 'Archive Mock',
    path: '/user',
    icon: <FontAwesomeIcon icon={faFolder} />,
    info: (
      <Label color="error" variant="inverted">
        +1
      </Label>
    ),
  },
  {
    title: 'Glossary',
    path: '/glossary-main',
    icon: <FontAwesomeIcon icon={faGlobe} />,
    info: (
      <Label color="error" variant="inverted">
        +4
      </Label>
    ),
  },
  {
    title: 'Not found',
    path: '/404',
    icon: icon('ic-disabled'),
  },
];
