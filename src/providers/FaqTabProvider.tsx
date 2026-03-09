import {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  PropsWithChildren,
  use
} from 'react';

interface FaqTabContextInterface {
  activeKey: string;
  setActiveKey: Dispatch<SetStateAction<string>>;
  subCategoryActiveKey: string;
  setSubCategoryActiveKey: Dispatch<SetStateAction<string>>;
  isOpenOffcanvas: boolean;
  setIsOpenOffcanvas: Dispatch<SetStateAction<boolean>>;
}

export const FaqTabContext = createContext({} as FaqTabContextInterface);

const FaqTabProvider = ({ children }: PropsWithChildren) => {
  const [activeKey, setActiveKey] = useState('all');
  const [subCategoryActiveKey, setSubCategoryActiveKey] = useState('sale-101');
  const [isOpenOffcanvas, setIsOpenOffcanvas] = useState(false);
  return (
    <FaqTabContext
      value={{
        activeKey,
        setActiveKey,
        subCategoryActiveKey,
        setSubCategoryActiveKey,
        isOpenOffcanvas,
        setIsOpenOffcanvas
      }}
    >
      {children}
    </FaqTabContext>
  );
};

export const useFaqTabContext = () => use(FaqTabContext);

export default FaqTabProvider;
