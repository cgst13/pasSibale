import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useState
} from 'react';

interface NavbarVerticalCollapseContextInterface {
  openItems: string[];
  setOpenItems: Dispatch<SetStateAction<string[]>>;
}

const NavbarVerticalCollapseContext = createContext(
  {} as NavbarVerticalCollapseContextInterface
);

const NavbarVerticalCollapseProvider = ({ children }: PropsWithChildren) => {
  const [openItems, setOpenItems] = useState(['']);
  return (
    <NavbarVerticalCollapseContext value={{ openItems, setOpenItems }}>
      {children}
    </NavbarVerticalCollapseContext>
  );
};

export const useNavbarVerticalCollapse = () =>
  use(NavbarVerticalCollapseContext);

export default NavbarVerticalCollapseProvider;
