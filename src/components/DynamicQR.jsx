import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '../utils/api';

const DynamicQR = ({ classId, sessionId }) => {
  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  const fetchToken = async () => {
    try {
      const res = await apiFetch(`/attendance/generate-qr/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setQrToken(data.qr_token);
        setTimeLeft(30);
      }
    } catch (e) {
      console.error("Failed to generate QR token:", e);
    }
  };

  useEffect(() => {
    fetchToken();
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const qrValue = qrToken ? JSON.stringify({ session_id: sessionId, qr_token: qrToken }) : "";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '2rem', borderRadius: '12px' }}>
      <h3 style={{ color: '#111827', marginBottom: '1rem' }}>Scan to Mark Attendance</h3>
      {qrValue && (
        <QRCodeSVG 
          value={qrValue} 
          size={256}
          fgColor="#000000"
          level="H"
          includeMargin={false}
        />
      )}
      {!qrValue && <div style={{width: 256, height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280'}}>Generating QR...</div>}
      <div style={{ marginTop: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#111827' }}>
        Expires in: <span style={{ color: timeLeft <= 5 ? '#ef4444' : '#3b82f6' }}>{timeLeft}s</span>
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem', textAlign: 'center' }}>
        Point your app scanner at this code.<br/>It refreshes automatically to prevent proxies.
      </p>
    </div>
  );
};

export default DynamicQR;
