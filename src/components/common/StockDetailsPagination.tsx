import { PropsWithChildren, useState } from 'react';
import {
  faAngleRight,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Button from 'components/base/Button';
import { Col, Pagination, Row } from 'react-bootstrap';

interface StockDetailsPaginationProps {
  currentPage: number;
  pageSize: number;
  totalItem: number;
  className?: string;
}

const StockDetailsPagination = ({
  currentPage,
  pageSize,
  totalItem,
  className,
  children
}: PropsWithChildren<StockDetailsPaginationProps>) => {
  const [isAllVisible, setIsAllVisible] = useState(false);
  return (
    <Row
      className={classNames(
        'flex-between-center py-2 pe-0 fs-9 stock-details-pagination',
        className
      )}
    >
      <Col xs="auto" className="d-flex">
        <p className="mb-0 d-none d-sm-block me-3 fw-semibold">
          {currentPage} to {pageSize}{' '}
          <span className="text-body-tertiary">Items of </span>
          {totalItem}
        </p>
        <Button
          variant="link"
          className="p-0 fw-semibold"
          onClick={() => setIsAllVisible(!isAllVisible)}
          endIcon={
            <FontAwesomeIcon
              icon={faAngleRight}
              className="ms-1"
              transform="down-1"
            />
          }
        >
          View {isAllVisible ? 'less' : 'all'}
        </Button>
      </Col>
      <Col xs="auto" className="me-sm-n2">
        <Pagination className="mb-0 justify-content-center align-items-center">
          <Pagination.Prev disabled={currentPage === 1} className="m-0">
            <FontAwesomeIcon icon={faChevronLeft} />
          </Pagination.Prev>
          {children}
          <Pagination.Next className="m-0">
            <FontAwesomeIcon icon={faChevronRight} />
          </Pagination.Next>
        </Pagination>
      </Col>
    </Row>
  );
};

export default StockDetailsPagination;
