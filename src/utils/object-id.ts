import { ObjectId } from 'mongodb';
import { ServiceError } from '@dgoudie/service-error';

export const validateAndConvertObjectId = (id: string | ObjectId) => {
  try {
    return id instanceof ObjectId ? id : new ObjectId(id);
  } catch (e) {
    throw new ServiceError(400, 'Invalid ID provided', e.stack);
  }
};
