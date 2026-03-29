import jwt from 'jsonwebtoken';

export const generateQRToken = (sessionId) => {
  return jwt.sign({ sessionId, timestamp: Date.now() }, process.env.QR_SECRET, { expiresIn: '1m' });
};

export const verifyQRToken = (token) => {
  try {
    return jwt.verify(token, process.env.QR_SECRET);
  } catch (error) {
    return null;
  }
};
