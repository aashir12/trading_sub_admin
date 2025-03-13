import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

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
    icon: icon('ic-cart'),
    info: (
      <Label color="error" variant="inverted">
        +2
      </Label>
    ),
  },
  {
    title: 'Archive',
    path: '/archive-list',
    icon: icon('ic-cart'),
    info: (
      <Label color="error" variant="inverted">
        +2
      </Label>
    ),
  },
  {
    title: 'Archive Mock',
    path: '/user',
    icon: icon('ic-cart'),
    info: (
      <Label color="error" variant="inverted">
        +1
      </Label>
    ),
  },
  {
    title: 'Glossary',
    path: '/glossary-main',
    icon: icon('ic-cart'),
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
