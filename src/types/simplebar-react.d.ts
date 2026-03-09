declare module 'simplebar-react' {
  import * as React from 'react';

  interface SimpleBarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export default class SimpleBar extends React.Component<SimpleBarProps> {}
}