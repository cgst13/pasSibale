import {
  Children,
  PropsWithChildren,
  ReactElement,
  cloneElement,
  useState,
  useEffect
} from 'react';
import SearchBox, { SearchBoxProps } from './SearchBox';
import { Dropdown, InputGroup, Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faQrcode, faIdCard, faFingerprint, faMobileAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import { useScannerContext } from 'providers/ScannerProvider';

interface DropdownSearchBoxProps extends SearchBoxProps {
  className?: string;
  searchBoxClassName?: string;
}

type SearchMode = 'name' | 'qr' | 'nfc' | 'fingerprint';

const DropdownSearchBox = ({
  children,
  className,
  searchBoxClassName,
  ...rest
}: PropsWithChildren<DropdownSearchBoxProps>) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('name');
  
  const { lastScan, connected } = useScannerContext();
  const [mountTime] = useState(Date.now());

  useEffect(() => {
    if (lastScan && lastScan.timestamp > mountTime) {
        setSearchInputValue(lastScan.value);
        setSearchMode(lastScan.type as SearchMode);
        setOpenDropdown(true);
        toast.success(`${lastScan.type.toUpperCase()} Scanned!`);
    }
  }, [lastScan, mountTime]);

  const handleScan = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchInputValue('');
    setOpenDropdown(true); // Open results to show scanning status
    
    if (connected) {
        toast.loading(`Waiting for ${mode.toUpperCase()} scan from mobile...`, {
            id: 'scan-toast',
            duration: 3000
        });
    } else {
        toast.error('Mobile scanner not connected. Please connect it in Settings.', {
            duration: 4000
        });
    }
  };

  const getPlaceholder = () => {
    switch (searchMode) {
      case 'qr': return 'Waiting for QR scan...';
      case 'nfc': return 'Waiting for NFC tap...';
      case 'fingerprint': return 'Waiting for fingerprint...';
      default: return 'Search citizens...';
    }
  };

  return (
    <Dropdown
      className={className}
      onToggle={(isOpen) => setOpenDropdown(isOpen)}
      show={openDropdown}
    >
      <Dropdown.Toggle as="div" aria-expanded={openDropdown} bsPrefix="toggle">
        <InputGroup size="sm" className="flex-nowrap">
          <SearchBox
            placeholder={getPlaceholder()}
            className={`${searchBoxClassName} flex-grow-1`}
            value={searchInputValue}
            onChange={({ target }) => {
              setSearchInputValue(target.value);
              setSearchMode('name'); // Switch back to name mode on manual typing
              setOpenDropdown(true);
            }}
            {...rest}
            style={{ width: 'auto', minWidth: '200px' }}
          />
          
          <OverlayTrigger placement="bottom" overlay={<Tooltip id="qr-tooltip">Scan QR Code</Tooltip>}>
            <Button 
                variant={searchMode === 'qr' ? 'primary' : 'phoenix-secondary'} 
                onClick={() => handleScan('qr')}
                className="px-3"
            >
                <FontAwesomeIcon icon={faQrcode} />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="nfc-tooltip">Tap NFC Card</Tooltip>}>
            <Button 
                variant={searchMode === 'nfc' ? 'primary' : 'phoenix-secondary'} 
                onClick={() => handleScan('nfc')}
                className="px-3"
            >
                <FontAwesomeIcon icon={faIdCard} />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="fp-tooltip">Scan Fingerprint</Tooltip>}>
            <Button 
                variant={searchMode === 'fingerprint' ? 'primary' : 'phoenix-secondary'} 
                onClick={() => handleScan('fingerprint')}
                className="px-3"
            >
                <FontAwesomeIcon icon={faFingerprint} />
            </Button>
          </OverlayTrigger>

        </InputGroup>
      </Dropdown.Toggle>
      {children && (
        <Dropdown.Menu
          className="dropdown-menu border font-base start-0 py-0 overflow-hidden w-100"
        >
          {Children.map(children, child =>
            cloneElement(child as ReactElement<any>, {
              searchValue: searchInputValue,
              searchMode: searchMode
            })
          )}
        </Dropdown.Menu>
      )}
    </Dropdown>
  );
};

export default DropdownSearchBox;
