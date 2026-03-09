import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useState
} from 'react';

interface CollapseContextInterface {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  showPreviewBtn: boolean;
  setShowPreviewBtn: Dispatch<SetStateAction<boolean>>;
  textToCopy: string;
  setTextToCopy: Dispatch<SetStateAction<string>>;
}

export const CollapseContext = createContext({} as CollapseContextInterface);

const PhoenixDocProvider = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false);
  const [showPreviewBtn, setShowPreviewBtn] = useState(true);
  const [textToCopy, setTextToCopy] = useState('');

  return (
    <CollapseContext
      value={{
        open,
        setOpen,
        showPreviewBtn,
        setShowPreviewBtn,
        textToCopy,
        setTextToCopy
      }}
    >
      {children}
    </CollapseContext>
  );
};

export const usePhoenixDocContext = () => use(CollapseContext);

export default PhoenixDocProvider;
