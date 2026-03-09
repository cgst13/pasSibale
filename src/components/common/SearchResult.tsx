
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown } from 'react-bootstrap';
import { Link } from 'react-router';
import { getFileIcon } from 'helpers/utils';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Avatar, { Status } from 'components/base/Avatar';
import Scrollbar from 'components/base/Scrollbar';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState, useEffect } from 'react';
import { faClockRotateLeft, faLink, faSearch, faUser } from '@fortawesome/free-solid-svg-icons';
import { searchCitizens } from 'services/citizenService';
import { Citizen } from 'types/citizen';
import useDebounce from 'hooks/useDebounce';

export interface SearchResult {
  label: string;
  category: string;
  url: string;
  image?: string;
  details?: string;
  icon?: IconProp | string;
  format?: string;
  status?: string;
  avatar?: string;
}

const ResultSectionHeader = ({ title }: { title: string }) => {
  return (
    <h6 className="text-body-highlight fs-9 border-y border-translucent py-2 lh-sm mb-0 px-3">
      {title}
    </h6>
  );
};

const SearchResult = ({ searchValue = '' }: { searchValue?: string }) => {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearchValue = useDebounce(searchValue, 300);

  useEffect(() => {
    const fetchCitizens = async () => {
      if (!debouncedSearchValue || debouncedSearchValue.length < 2) {
        setCitizens([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchCitizens(debouncedSearchValue);
        setCitizens(results || []);
      } catch (error) {
        console.error('Error searching citizens:', error);
        setCitizens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCitizens();
  }, [debouncedSearchValue]);

  return (
    <Scrollbar style={{ maxHeight: '30rem'}}>
      {loading ? (
        <div className="p-3 text-center text-body-tertiary">
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Searching...
        </div>
      ) : (
        <>
           <h6 className="text-body-highlight fs-10 py-2 mb-0 px-3">
            {citizens.length} <span className="text-body-quaternary">Results</span>{' '}
          </h6>
          
          {citizens.length > 0 ? (
            <>
              <ResultSectionHeader title="Citizens" />
              <div className="py-2">
                {citizens.map(citizen => (
                  <Dropdown.Item 
                    as={Link} 
                    to={`/citizens/${citizen.id}`} 
                    key={citizen.id}
                    className="py-2"
                  >
                    <div className="d-flex align-items-center fw-normal text-body-highlight">
                      <Avatar
                        src={citizen.photoUrl}
                        size="l"
                        className="me-2"
                        placeholder={<FontAwesomeIcon icon={faUser} />}
                      />
                      <div className="flex-1 overflow-hidden">
                        <h6 className="mb-0 text-body-highlight title text-truncate">
                          {citizen.firstName} {citizen.lastName}
                        </h6>
                        <p className="fs-10 mb-0 d-flex text-body-tertiary text-truncate">
                          ID: {citizen.id} • {citizen.barangay}
                        </p>
                      </div>
                    </div>
                  </Dropdown.Item>
                ))}
              </div>
            </>
          ) : debouncedSearchValue.length >= 2 ? (
            <div className="p-3 text-center text-body-tertiary">
              No citizens found matching "{debouncedSearchValue}"
            </div>
          ) : (
             <div className="p-3 text-center text-body-tertiary opacity-50">
                <FontAwesomeIcon icon={faSearch} className="mb-2" />
                <p className="mb-0 fs-10">Type at least 2 characters to search citizens</p>
             </div>
          )}
        </>
      )}
    </Scrollbar>
  );
};

export default SearchResult;
