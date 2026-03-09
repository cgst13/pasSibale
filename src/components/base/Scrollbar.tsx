import classNames from 'classnames';
import { PropsWithChildren } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

interface ScrollbarProps {
  className?: string;
  style?: React.CSSProperties;
}

const Scrollbar = ({
  children,
  className,
  style,
  ...rest
}: PropsWithChildren<ScrollbarProps>) => {
  return (
    <SimpleBar
      className={classNames('custom-scrollbar', className)}
      style={style}
      {...rest}
    >
      {children}
    </SimpleBar>
  );
};

export default Scrollbar;
