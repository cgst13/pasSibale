import { JSX } from 'react';
import {
  UilEstate,
  UilGift,
  UilLamp,
  UilMobileAndroid,
  UilMonitor,
  UilPalette,
  UilPlaneDeparture,
  UilShoppingBag,
  UilStar,
  UilWatchAlt,
  UilWrench
} from '@iconscout/react-unicons';
import classNames from 'classnames';
import { Link } from 'react-router';

type Category = {
  label: string;
  icon: JSX.Element;
  url: string;
  bgClass?: string;
};

const categories: Category[] = [
  {
    label: 'Deals',
    bgClass: 'bg-warning-subtle',
    url: '#!',
    icon: <UilStar fill='currentColor' className="text-warning" size={39} />
  },
  {
    label: 'Grocery',
    url: '#!',
    icon: <UilShoppingBag fill='currentColor' size={39} />
  },
  {
    label: 'Fashion',
    url: '#!',
    icon: <UilWatchAlt fill='currentColor' size={39} />
  },
  {
    label: 'Mobile',
    url: '#!',
    icon: <UilMobileAndroid fill='currentColor' size={39} />
  },
  {
    label: 'Electronics',
    url: '#!',
    icon: <UilMonitor fill='currentColor' size={39} />
  },
  {
    label: 'Home',
    url: '#!',
    icon: <UilEstate fill='currentColor' size={39} />
  },
  {
    label: 'Dining',
    url: '#!',
    icon: <UilLamp fill='currentColor' size={39} />
  },
  {
    label: 'Gifts',
    url: '#!',
    icon: <UilGift fill='currentColor' size={39} />
  },
  {
    label: 'Tools',
    url: '#!',
    icon: <UilWrench fill='currentColor' size={39} />
  },
  {
    label: 'Travel',
    url: '#!',
    icon: <UilPlaneDeparture fill='currentColor' size={39} />
  },
  {
    label: 'Others',
    url: '#!',
    icon: <UilPalette fill='currentColor' size={39} />
  }
];

const EcomCategoryNavs = () => {
  return (
    <div className="d-flex justify-content-between">
      {categories.map(category => (
        <EcomCategoryNavItem key={category.label} category={category} />
      ))}
    </div>
  );
};

const EcomCategoryNavItem = ({ category }: { category: Category }) => {
  return (
    <Link to={category.url} className="icon-nav-item mb-3">
      <div className={classNames(category.bgClass, 'icon-container mb-2')}>
        {category.icon}
      </div>
      <p className="nav-label mb-0">{category.label}</p>
    </Link>
  );
};

export default EcomCategoryNavs;
