import { ElementType } from 'react';
import { To } from 'react-router';

declare module 'react-bootstrap' {
  interface ButtonProps {
    as?: ElementType;
    to?: To;
    htmlFor?: string;
  }
}
