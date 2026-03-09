import { UseWizardFormResult } from 'hooks/useWizardForm';
import { Context, PropsWithChildren, createContext, use } from 'react';
import { Tab } from 'react-bootstrap';

interface WizardFormContextInterface<T> extends UseWizardFormResult<T> {}
interface WizardFormProviderInterface<T>
  extends WizardFormContextInterface<T> {}

export const WizardFormContext = createContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  {} as WizardFormContextInterface<any>
);

const WizardFormProvider = <T,>({
  children,
  ...rest
}: PropsWithChildren<WizardFormProviderInterface<T>>) => {
  const { selectedStep, goToStep } = rest;
  return (
    <WizardFormContext value={{ ...rest }}>
      <Tab.Container
        activeKey={selectedStep}
        onSelect={(eventKey: string | null) => {
          if (eventKey) {
            goToStep(Number(eventKey));
          }
        }}
      >
        {children}
      </Tab.Container>
      {/* <WizardAccessDeniedModal /> */}
    </WizardFormContext>
  );
};

export const useWizardFormContext = <T,>() =>
  use(WizardFormContext as Context<WizardFormContextInterface<T>>);

export default WizardFormProvider;
