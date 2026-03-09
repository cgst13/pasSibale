import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useState
} from 'react';

interface ScrollSpyContextInterface {
  activeElemId: string;
  setActiveElemId: Dispatch<SetStateAction<string>>;
  visibleItems: string[];
  setVisibleItems: Dispatch<SetStateAction<string[]>>;
}

export const ScrollSpyContext = createContext({} as ScrollSpyContextInterface);

const ScrollSpyProvider = ({ children }: PropsWithChildren) => {
  const [activeElemId, setActiveElemId] = useState('');
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  return (
    <ScrollSpyContext
      value={{ activeElemId, setActiveElemId, visibleItems, setVisibleItems }}
    >
      {children}
    </ScrollSpyContext>
  );
};

export const useScrollSpyContext = () => use(ScrollSpyContext);

export default ScrollSpyProvider;
