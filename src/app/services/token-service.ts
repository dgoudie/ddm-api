import { addMinutes, addMonths, isAfter } from 'date-fns';

import { getLogger } from 'log4js';
import jwt from 'jsonwebtoken';

const JWT_SECRET_WITH_PASSWORD = `${process.env.JWT_SECRET}_${process.env.LOGIN_PASSWORD}`;

type JWTPayload = {
  iat: number;
  exp: number;
};

export const generateTokenFromPassword = (password: string) => {
  const decodedPassword = Buffer.from(password, 'base64').toString();
  if (decodedPassword !== process.env.LOGIN_PASSWORD) {
    getLogger().warn('Invalid Password');
    throw new Error('Invalid Password');
  }
  return generateToken();
};

export const verifyToken = (token: string): boolean => {
  try {
    jwt.verify(token, JWT_SECRET_WITH_PASSWORD);
  } catch (e) {
    return false;
  }
  return true;
};

export const generateNewTokenIfNecessary = (
  validatedToken: string
): { token: string; expires: number } | null => {
  if (!validatedToken) {
    return null;
  }
  let jsonPayload: JWTPayload;
  try {
    const payload = jwt.decode(validatedToken);
    if (typeof payload === 'string') {
      jsonPayload = JSON.parse(validatedToken);
    } else {
      jsonPayload = payload as JWTPayload;
    }
  } catch (e) {
    return null;
  }
  const { iat, exp } = jsonPayload;
  const expired = isAfter(new Date(), exp);
  if (expired) {
    return null;
  }
  const issuedTimePlus5Minutes = addMinutes(iat, 5);
  const shouldIssueNewToken = isAfter(new Date(), issuedTimePlus5Minutes);
  if (shouldIssueNewToken) {
    return generateToken();
  }
  return null;
};

const generateToken = (): { token: string; expires: number } => {
  const iat = Date.now();
  const oneMonthFromNow = addMonths(iat, 1);
  const exp = oneMonthFromNow.getTime();
  const payload: JWTPayload = {
    iat,
    exp,
  };
  return { token: jwt.sign(payload, JWT_SECRET_WITH_PASSWORD), expires: exp };
};
