import {
  addMinutes,
  addMonths,
  addSeconds,
  compareAsc,
  compareDesc,
  isAfter,
} from 'date-fns';

import { getLogger } from 'log4js';
import jwt from 'jsonwebtoken';

export const generateTokenFromPassword = (password: string) => {
  if (password !== process.env.LOGIN_PASSWORD) {
    getLogger().warn('Invalid Password');
    throw new Error('Invalid Password');
  }
  return generateToken();
};

export const validateToken = (token: string): string | null => {
  if (!token) {
    throw new Error();
  }
  //@ts-ignore
  const { iat, exp } = jwt.verify(token, process.env.JWT_SECRET);
  const expired = isAfter(new Date(), exp);
  if (!!expired) {
    throw new Error();
  }
  const issuedTimePlus5Minutes = addSeconds(iat, 5);
  const shouldIssueNewToken = isAfter(new Date(), issuedTimePlus5Minutes);
  if (shouldIssueNewToken) {
    return generateToken();
  }
  return null;
};

const generateToken = () => {
  const iat = Date.now();
  const oneMonthFromNow = addMonths(iat, 1);
  const payload = {
    iat: Date.now(),
    exp: oneMonthFromNow.getTime(),
  };
  return jwt.sign(payload, process.env.JWT_SECRET);
};
