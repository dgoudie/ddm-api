import { MongoError } from 'mongodb';
import { ServiceError } from '@dgoudie/service-error';

const DOCUMENT_VALIDATION_FAILED_CODE = 121;

export const translateMongodbException = (
  validationFailureMessage = 'Invalid data provided - Validation failed.'
) => (error: MongoError) => {
  if (error.code === DOCUMENT_VALIDATION_FAILED_CODE) {
    throw new ServiceError(400, validationFailureMessage, error.stack);
  } else {
    throw new ServiceError(500, error.message, error.stack);
  }
};
