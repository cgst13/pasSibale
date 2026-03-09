import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  ReactElement } from 'react';
import Select, {
  ClearIndicatorProps,
  DropdownIndicatorProps,
  SelectInstance,
  components
} from 'react-select';
import { Props } from 'react-select';

interface ReactSelectProps extends Props {
  icon?: ReactElement;
  ref?: React.Ref<SelectInstance>;
}

const ClearIndicator = (props: ClearIndicatorProps) => {
  const {
    innerProps: { ref, ...restInnerProps }
  } = props;
  return (
    <div {...restInnerProps} ref={ref} className="me-2">
      <div className="text-primary fs-9">clear</div>
    </div>
  );
};

const DropdownIndicator = (props: DropdownIndicatorProps) => {
  return (
    <components.DropdownIndicator {...props}>
      <FontAwesomeIcon icon={faAngleDown} className="fs-9 text-body" />
    </components.DropdownIndicator>
  );
};

const ReactSelect = ({ icon, ref, ...rest }: ReactSelectProps) => {
  return (
    <div className="react-select-container">
      <Select
        closeMenuOnSelect={false}
        openMenuOnFocus
        ref={ref}
        components={{ ClearIndicator, DropdownIndicator }}
        classNamePrefix="react-select"
        classNames={{
          control: () => (icon ? 'ps-5' : ''),
          placeholder: () => (icon ? 'ps-2' : '')
        }}
        {...rest}
      />
      {icon}
    </div>
  );
};

ReactSelect.displayName = 'ReactSelect';

export default ReactSelect;
