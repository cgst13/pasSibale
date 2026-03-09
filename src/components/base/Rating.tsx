import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import {
  Rating as ReactRating,
  RatingProps as ReactRatingProps
} from 'react-simple-star-rating';
import { useAppContext } from 'providers/AppProvider';

export interface RatingProps extends ReactRatingProps {
  iconClass?: string;
  fillIconColor?: string;
  emptyIconColor?: string;
}

const Rating = ({
  iconClass,
  fillIconColor = 'warning',
  emptyIconColor = 'warning-light',
  ...rest
}: RatingProps) => {
  const {
    config: { isRTL }
  } = useAppContext();
  return (
    <ReactRating
      allowFraction
      rtl={isRTL}
      fillIcon={
        <FontAwesomeIcon
          icon={faStar}
          className={classNames(iconClass, `text-${fillIconColor}`)}
        />
      }
      emptyIcon={
        <FontAwesomeIcon
          icon={farStar}
          className={classNames(iconClass, `text-${emptyIconColor}`)}
        />
      }
      {...rest}
    />
  );
};

export default Rating;
