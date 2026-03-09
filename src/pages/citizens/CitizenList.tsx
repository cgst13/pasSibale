import { ColumnDef } from '@tanstack/react-table';
import AdvanceTable from 'components/base/AdvanceTable';
import AdvanceTableFooter from 'components/base/AdvanceTableFooter';
import Badge from 'components/base/Badge';
import RevealDropdown, { RevealDropdownTrigger } from 'components/base/RevealDropdown';
import SearchBox from 'components/common/SearchBox';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import useAdvanceTable from 'hooks/useAdvanceTable';
import AdvanceTableProvider from 'providers/AdvanceTableProvider';
import { Link } from 'react-router';
import { Citizen } from 'types/citizen';
import { getCitizens, deleteCitizen } from 'services/citizenService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button, Dropdown } from 'react-bootstrap';
import { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import { Form } from 'react-bootstrap';
import ConfirmationModal from 'components/common/ConfirmationModal';
import DevicePairingModal from 'components/common/DevicePairingModal';
import { faMobileAlt } from '@fortawesome/free-solid-svg-icons';
import { useScannerContext } from 'providers/ScannerProvider';

const CitizenList = () => {
  const [data, setData] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);

  // Handle global scan events hooks must be called before any conditional returns
  const { lastScan } = useScannerContext();
  const [mountTime] = useState(Date.now());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await getCitizens();
      setData(result);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load citizens');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteCitizen(deleteId);
      setData(prev => prev.filter(c => c.id !== deleteId));
      toast.success('Citizen deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete citizen');
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const columns = useMemo<ColumnDef<Citizen>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => `${row.lastName}, ${row.firstName} ${row.middleName || ''} ${row.suffix || ''}`,
        header: 'Name',
        cell: ({ row }) => {
          const { firstName, lastName, middleName, suffix } = row.original;
          return (
            <Link to={`/citizens/view/${row.original.id}`} className="fw-bold">
              {lastName}, {firstName} {middleName} {suffix}
            </Link>
          );
        }
      },
      {
        accessorKey: 'sex',
        header: 'Sex',
        meta: {
          headerProps: { className: 'text-center' },
          cellProps: { className: 'text-center' }
        }
      },
      {
        accessorKey: 'age',
        header: 'Age',
        meta: {
          headerProps: { className: 'text-center' },
          cellProps: { className: 'text-center' }
        }
      },
      {
        accessorKey: 'barangay',
        header: 'Barangay'
      },
      {
        accessorKey: 'mobileNumber',
        header: 'Mobile Number'
      },
      {
        accessorKey: 'residencyStatus',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <Badge variant="phoenix" bg={status === 'Permanent' ? 'success' : 'warning'}>
              {status}
            </Badge>
          );
        },
        meta: {
          headerProps: { className: 'text-center' },
          cellProps: { className: 'text-center' }
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <RevealDropdownTrigger>
            <RevealDropdown>
              <Dropdown.Item as={Link} to={`/citizens/view/${row.original.id}`}>View</Dropdown.Item>
              <Dropdown.Item as={Link} to={`/citizens/edit/${row.original.id}`}>Edit</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item 
                className="text-danger" 
                onClick={() => handleDeleteClick(row.original.id)}
              >
                Remove
              </Dropdown.Item>
            </RevealDropdown>
          </RevealDropdownTrigger>
        ),
        meta: {
          headerProps: { className: 'text-end' },
          cellProps: { className: 'text-end' }
        }
      }
    ],
    []
  );

  const table = useAdvanceTable<Citizen>({
    data,
    columns,
    pageSize: 10,
    pagination: true,
    sortable: true,
    selection: true
  });

  const breadcrumbItems = [
    { label: 'Citizens', active: true }
  ];

  const barangays = useMemo(() => {
    return Array.from(new Set(data.map(c => c.barangay))).sort();
  }, [data]);

  const handleMobileScan = (value: string, type: 'qr' | 'nfc' | 'fingerprint') => {
    if (type === 'fingerprint') {
        toast.error('Remote fingerprint scanning is not fully supported yet.');
        return;
    }
    table.setGlobalFilter(value);
    toast.success('Search updated from mobile scan');
  };

  useEffect(() => {
    if (lastScan && lastScan.timestamp > mountTime) {
        handleMobileScan(lastScan.value, lastScan.type);
    }
  }, [lastScan, mountTime]);

  if (loading) return <PasSibaleLoader />;

  return (
    <div>
      <PageBreadcrumb items={breadcrumbItems} />
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h2 className="mb-0">Citizen List</h2>
        <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => setShowPairingModal(true)}>
                <FontAwesomeIcon icon={faMobileAlt} className="me-2" />
                Connect Mobile
            </Button>
            <Button as={Link} to="/citizens/add" variant="primary">
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Citizen
            </Button>
        </div>
      </div>

      <AdvanceTableProvider {...table}>
        <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
          <SearchBox placeholder="Search citizens..." onChange={(e: ChangeEvent<HTMLInputElement>) => table.setGlobalFilter(e.target.value)} />
          
          <div className="d-flex align-items-center gap-2">
            <Form.Select 
                size="sm" 
                style={{ width: '200px' }}
                onChange={(e) => table.getColumn('barangay')?.setFilterValue(e.target.value || undefined)}
            >
                <option value="">All Barangays</option>
                {barangays.map(b => (
                    <option key={b} value={b}>{b}</option>
                ))}
            </Form.Select>
            <div className="text-body-secondary text-nowrap">
              {table.getFilteredRowModel().rows.length} records found
            </div>
          </div>
        </div>
        
        <div className="mx-n4 px-4 mx-lg-n6 px-lg-6 bg-body-emphasis border-top border-bottom border-translucent position-relative top-1">
          <AdvanceTable tableProps={{ className: 'phoenix-table fs-9 mb-0 border-top border-translucent' }} />
          {table.getRowModel().rows.length === 0 && (
            <div className="text-center py-5">
              <h4 className="text-body-tertiary">No results found</h4>
              <p className="text-body-quaternary">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
        
        <AdvanceTableFooter pagination />
      </AdvanceTableProvider>

      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Citizen"
        message="Are you sure you want to delete this citizen? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        icon="trash"
      />
      
      <DevicePairingModal 
        show={showPairingModal} 
        onHide={() => setShowPairingModal(false)} 
        onScan={handleMobileScan} 
      />
    </div>
  );
};

export default CitizenList;
