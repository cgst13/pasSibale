import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useState
} from 'react';

interface MainLayoutContextInterface {
  contentClass: string;
  setContentClass: Dispatch<SetStateAction<string>>;
  footerClass: string;
  setFooterClass: Dispatch<SetStateAction<string>>;
}

export const MainLayoutContext = createContext(
  {} as MainLayoutContextInterface
);

const MainLayoutProvider = ({ children }: PropsWithChildren) => {
  const [contentClass, setContentClass] = useState('');
  const [footerClass, setFooterClass] = useState('');
  return (
    <MainLayoutContext
      value={{ contentClass, setContentClass, footerClass, setFooterClass }}
    >
      {children}
    </MainLayoutContext>
  );
};

export const useMainLayoutContext = () => use(MainLayoutContext);

export default MainLayoutProvider;
