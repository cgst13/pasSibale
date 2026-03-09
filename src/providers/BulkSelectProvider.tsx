import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { PropsWithChildren, createContext, use } from 'react';

interface BulkSelectContextInterface<T> {
  getParentCheckboxProps: () => {
    checked: boolean;
    indeterminate: boolean;
    onChange: (event: unknown) => void;
  };
  getRowCheckboxProps: (id: string) => {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    onChange: (event: unknown) => void;
  };
  getSelectedRows: () => T[];
}

export const BulkSelectContext = createContext({});

const BulkSelectProvider = <T,>({
  data,
  children
}: PropsWithChildren<{ data: T[] }>) => {
  const table = useReactTable<T>({
    data,
    columns: [],
    getCoreRowModel: getCoreRowModel()
  });

  const getParentCheckboxProps = () => {
    return {
      checked: table.getIsAllRowsSelected(),
      indeterminate: table.getIsSomeRowsSelected(),
      onChange: table.getToggleAllRowsSelectedHandler()
    };
  };

  const getRowCheckboxProps = (id: string) => {
    const row = table.getRow(id);
    return {
      checked: row.getIsSelected(),
      disabled: !row.getCanSelect(),
      indeterminate: row.getIsSomeSelected(),
      onChange: row.getToggleSelectedHandler()
    };
  };

  const getSelectedRows = () => {
    return table.getSelectedRowModel().rows.map(row => row.original);
  };

  return (
    <BulkSelectContext
      value={{ getParentCheckboxProps, getRowCheckboxProps, getSelectedRows }}
    >
      {children}
    </BulkSelectContext>
  );
};

export const useBulkSelect = <T,>() =>
  use(BulkSelectContext) as BulkSelectContextInterface<T>;

export default BulkSelectProvider;
