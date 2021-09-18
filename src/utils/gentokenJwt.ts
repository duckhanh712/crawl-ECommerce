import jwt from 'jsonwebtoken';
import { JWT_KEY } from '../constants/config'


export let verifyToken = (token,resp) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_KEY, (error, decoded) => {
      if (decoded) {
        return resolve(decoded)
      }
      reject(error);
      return resp.status(401).send('Unauthorized.');

    });
  });
}

export default (data) => {
  return jwt.sign(data, JWT_KEY, {
    expiresIn: 86400,
  });
};