import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown } from 'react-bootstrap';

const ImageAttachmentPreview = ({
  image,
  previewHight = 140,
  previewWidth = 200,
  handleClose
}: {
  image: string;
  handleClose: () => void;
  previewHight?: number;
  previewWidth?: number;
}) => {
  return (
    <div
      className="rounded-2 overflow-hidden mb-2 position-relative"
      style={{ height: previewHight, width: previewWidth }}
    >
      <img src={image} className="w-100 h-100 object-fit-cover" alt="" />
      <Dropdown className="position-absolute end-0 top-0 mt-2 me-2">
        <Dropdown.Toggle
          className="text-body bg-body dropdown-caret-none px-3 py-2"
          id="dropdown-basic"
        >
          <FontAwesomeIcon icon={faEllipsisH} />
        </Dropdown.Toggle>
        <Dropdown.Menu className="py-1" align="end">
          <Dropdown.Item href="#/action-1" onClick={handleClose}>
            Remove
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default ImageAttachmentPreview;
