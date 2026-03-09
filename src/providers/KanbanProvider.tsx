import { KanbanBoardItem, kanbanItems } from 'data/kanban';
import {
  Dispatch,
  PropsWithChildren,
  createContext,
  use,
  useReducer
} from 'react';
import { ACTIONTYPE, kanbanReducer } from 'reducers/KanbanReducer';

export type ConversationFilterType = 'all' | 'read' | 'unread';
interface KanbanProviderInterface {}

export interface KanbanState {
  openBoardDetailsOffcanvas: boolean;
  openAddListModal: boolean;
  boardLists: KanbanBoardItem[];
}

interface KanbanContextInterface extends KanbanState {
  kanbanDispatch: Dispatch<ACTIONTYPE>;
}

export const KanbanContext = createContext({} as KanbanContextInterface);

const useKanbanReducer = () => {
  const initState: KanbanState = {
    openBoardDetailsOffcanvas: false,
    openAddListModal: false,
    boardLists: kanbanItems
  };

  return useReducer(kanbanReducer, initState);
};

const KanbanProvider = ({
  children
}: PropsWithChildren<KanbanProviderInterface>) => {
  const [kanbanState, kanbanDispatch] = useKanbanReducer();

  return (
    <KanbanContext
      value={{
        ...kanbanState,
        kanbanDispatch
      }}
    >
      {children}
    </KanbanContext>
  );
};

export const useKanbanContext = () => use(KanbanContext);

export default KanbanProvider;
