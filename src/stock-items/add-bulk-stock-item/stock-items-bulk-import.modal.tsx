import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, ModalBody, ModalFooter, ModalHeader, FileUploader } from '@carbon/react';
import { getCoreTranslation, showSnackbar } from '@openmrs/esm-framework';
import { uploadStockItems } from './stock-items-bulk-import.resource';

export interface ImportBulkStockItemsModalProps {
  closeModal: () => void;
}

const ImportBulkStockItemsModal: React.FC<ImportBulkStockItemsModalProps> = ({ closeModal }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<any>();
  const [isUploading, setIsUploading] = useState(false);

  const onConfirmUpload = () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();

    if (selectedFile) {
      formData.append('file', selectedFile, 'Import_Stock_Items.csv');
      formData.append('hasHeader', 'true');
    }

    setIsUploading(true);
    uploadStockItems(formData)
      .then(
        () => {
          showSnackbar({
            kind: 'success',
            title: t('stockItemsUploadedSuccessfully', 'Stock items uploaded successfully'),
          });
          closeModal();
        },
        (err) => {
          showSnackbar({
            kind: 'error',
            isLowContrast: false,
            subtitle: err?.message,
            title: t('errorUploadingItems', 'An error occurred uploading stock items'),
          });
        },
      )
      .finally(() => setIsUploading(false));
  };

  const onFileChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (file) {
      setSelectedFile(file);
    } else {
      event.preventDefault();
    }
  };

  return (
    <div>
      <Form>
        <ModalHeader closeModal={closeModal} title={t('importStockItems', 'Import stock items')} />
        <ModalBody>
          <FileUploader
            accept={['.csv']}
            buttonLabel={t('selectFile', 'Select file')}
            filenameStatus="edit"
            labelDescription={t('onlyCsvFilesAt2mbOrLess', 'Only .csv files at 2MB or less')}
            labelTitle=""
            multiple={false}
            name="file"
            onChange={onFileChanged}
            size="sm"
          />
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeModal}>
            {getCoreTranslation('cancel')}
          </Button>
          <Button type="button" disabled={isUploading} onClick={onConfirmUpload}>
            {t('uploadStockItems', 'Upload stock items')}
          </Button>
        </ModalFooter>
      </Form>
    </div>
  );
};

export default ImportBulkStockItemsModal;
