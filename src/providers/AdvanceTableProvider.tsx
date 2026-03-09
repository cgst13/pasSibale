import { Table } from '@tanstack/react-table';
import { PropsWithChildren, createContext, use } from 'react';

export const AdvanceTableContext = createContext({});

const AdvanceTableProvider = ({ children, ...rest }: PropsWithChildren) => {
  return (
    <AdvanceTableContext value={{ ...rest }}>
      {children}
    </AdvanceTableContext>
  );
};

export const useAdvanceTableContext = <T,>() =>
  use(AdvanceTableContext) as Table<T>;

export default AdvanceTableProvider;
