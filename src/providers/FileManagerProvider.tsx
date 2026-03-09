import { File, fileCollection as filesData } from 'data/file-manager';
import {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  PropsWithChildren,
  useEffect,
  use
} from 'react';
import { gridBreakpoints } from './BreakpointsProvider';
interface FileManagerContextInterface {
  fileCollection: File[];
  setFileCollection: Dispatch<SetStateAction<File[]>>;
  showFileDetails: boolean;
  setShowFileDetails: Dispatch<SetStateAction<boolean>>;
  checkedFileIds: number[];
  setCheckedFileIds: Dispatch<SetStateAction<number[]>>;
  isGridView: boolean;
  setIsGridView: Dispatch<SetStateAction<boolean>>;
  isGrouped: boolean;
  setIsGrouped: Dispatch<SetStateAction<boolean>>;
}

export const FileManagerContext = createContext(
  {} as FileManagerContextInterface
);

const FileManagerProvider = ({ children }: PropsWithChildren) => {
  const [fileCollection, setFileCollection] = useState<File[]>([]);
  const [showFileDetails, setShowFileDetails] = useState(
    window.innerWidth >= gridBreakpoints.xxl
  );
  const [checkedFileIds, setCheckedFileIds] = useState<number[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  const [isGrouped, setIsGrouped] = useState(false);

  useEffect(() => {
    setFileCollection(filesData);
  }, []);

  return (
    <FileManagerContext
      value={{
        fileCollection,
        setFileCollection,
        showFileDetails,
        setShowFileDetails,
        checkedFileIds,
        setCheckedFileIds,
        isGridView,
        setIsGridView,
        isGrouped,
        setIsGrouped
      }}
    >
      {children}
    </FileManagerContext>
  );
};

export const useFileManagerContext = () => use(FileManagerContext);

export default FileManagerProvider;
