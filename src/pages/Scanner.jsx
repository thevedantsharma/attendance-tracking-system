import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, ScanFace, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import './Scanner.css';

const Scanner = () => {
  const [activeTab, setActiveTab] = useState('face');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const [userProfile, setUserProfile] = useState(null);
  const [storedDescriptor, setStoredDescriptor] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);

        const token = localStorage.getItem('token');
        const [userRes, classesRes] = await Promise.all([
          fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (userRes.ok) {
          const u = await userRes.json();
          setUserProfile(u);
          if (u.faceDescriptor) {
            setStoredDescriptor(new Float32Array(JSON.parse(u.faceDescriptor)));
          }
        }
        if (classesRes.ok) {
          const cls = await classesRes.json();
          const active = cls.filter(c => c.active_session_id);
          setActiveSessions(active);
          if (active.length > 0) setSelectedSessionId(active[0].active_session_id);
        }
      } catch (err) {
        console.error("Initialization error", err);
      }
    };
    init();
  }, []);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (activeTab !== 'face') stopWebcam();
    return stopWebcam;
  }, [activeTab]);

  const startWebcam = async (registerMode = false) => {
    setScanResult(null);
    setIsRegistering(registerMode);
    
    if (!registerMode && !selectedSessionId) {
      setScanResult({ success: false, message: 'No active session selected.' });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocating(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      } catch (err) {
        setScanResult({ success: false, message: 'Webcam access denied.' });
      }
    }, (err) => {
      setLocating(false);
      setScanResult({ success: false, message: 'Geolocation is required.' });
    });
  };

  const markAttendance = async (sessionId, method, lat, lng) => {
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ session_id: sessionId, method, coords: { latitude: lat, longitude: lng } })
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult({ success: true, message: 'Attendance marked successfully!', student: userProfile?.name });
      } else {
        setScanResult({ success: false, message: data.error });
      }
    } catch(e) {
      setScanResult({ success: false, message: 'Network error connecting to backend.' });
    }
  };

  const handleVideoPlay = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const interval = setInterval(async () => {
      if (!isScanning || !videoRef.current) {
        clearInterval(interval);
        return;
      }
      
      const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      if (!detections) return;

      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      faceapi.draw.drawDetections(canvasRef.current, resized);

      if (isRegistering) {
        clearInterval(interval);
        stopWebcam();
        try {
          const res = await fetch('/api/users/me/face', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ faceDescriptor: Array.from(detections.descriptor) })
          });
          if(res.ok) {
            setStoredDescriptor(detections.descriptor);
            setScanResult({ success: true, message: 'Face registered successfully!' });
          } else {
            const err = await res.json();
            setScanResult({ success: false, message: err.error });
          }
        } catch(e) {
          setScanResult({ success: false, message: 'Error registering face.' });
        }
      } else {
        // Attendance Mode
        if (storedDescriptor) {
          const distance = faceapi.euclideanDistance(storedDescriptor, detections.descriptor);
          if (distance < 0.5) {
            clearInterval(interval);
            stopWebcam();
            await markAttendance(selectedSessionId, 'face', location?.lat, location?.lng);
          } else {
            // Keep scanning, maybe show feedback on canvas, but for now we just don't match
          }
        }
      }
    }, 1000);
  };

  const handleQRScan = async (result) => {
    if (!result || result.length === 0) return;
    try {
      const data = JSON.parse(result[0].rawValue);
      navigator.geolocation.getCurrentPosition(async (pos) => {
        // Now sending qr_token to the backend for validation
        const body = { 
          session_id: data.session_id, 
          method: 'qr', 
          qr_token: data.qr_token,
          coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        };

        const res = await fetch('/api/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const resData = await res.json();
        if (res.ok) {
          setScanResult({ success: true, message: 'Attendance marked via secure QR!' });
        } else {
          setScanResult({ success: false, message: resData.error });
        }
      }, () => {
        setScanResult({ success: false, message: 'Location needed for QR scanning.' });
      });
    } catch(e) {
      setScanResult({ success: false, message: 'Invalid QR Format.' });
    }
  };

  return (
    <div className="scanner-container">
      <header className="scanner-header">
        <h1 className="scanner-title">Mark Attendance</h1>
        <p className="scanner-subtitle">AI Face Recognition System</p>
      </header>

      <div className="scanner-tabs">
        <button 
          className={`tab-btn ${activeTab === 'face' ? 'active' : ''}`}
          onClick={() => { setActiveTab('face'); setScanResult(null); }}
        >
          <ScanFace size={20} /> Face Scan
        </button>
        <button 
          className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
          onClick={() => { setActiveTab('qr'); setScanResult(null); }}
        >
          <QrCode size={20} /> QR Code
        </button>
      </div>

      <div className="glass-panel" style={{ width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {activeTab === 'face' && (
          <div style={{width: '100%', maxWidth: '640px'}}>
            {!storedDescriptor && !isScanning && (
              <div style={{background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 8, marginBottom: '1rem', border: '1px solid rgb(59, 130, 246)', color: 'var(--text-primary)'}}>
                <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}><UserPlus size={20} color="#3b82f6"/> Face Not Registered</h3>
                <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>You need to register your face before marking attendance.</p>
                <button className="btn-primary" onClick={() => startWebcam(true)} disabled={!modelsLoaded} style={{marginTop: '1rem'}}>
                  {modelsLoaded ? 'Register Face Now' : 'Loading AI...'}
                </button>
              </div>
            )}

            {storedDescriptor && !isScanning && (
               <div style={{marginBottom: '1rem', width: '100%'}}>
                 <label style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Select Active Session</label>
                 <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} style={{width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', marginTop: 4}}>
                   {activeSessions.length === 0 ? <option value="">No active sessions found</option> : activeSessions.map(s => (
                     <option key={s.active_session_id} value={s.active_session_id}>{s.name}</option>
                   ))}
                 </select>
               </div>
            )}

            <div className="scanner-view" style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
              {!isScanning && storedDescriptor && (
                <div className="scanner-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                  <button className="btn-primary" onClick={() => startWebcam(false)} disabled={!modelsLoaded || locating || !selectedSessionId}>
                    {locating ? 'Acquiring GPS...' : (!selectedSessionId ? 'No Session' : (modelsLoaded ? 'Start Camera Scan' : 'Loading AI Models...'))}
                  </button>
                </div>
              )}
              
              <video 
                ref={videoRef} autoPlay muted onPlay={handleVideoPlay}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: isScanning ? 'block' : 'none' }} 
              />
              <canvas 
                ref={canvasRef} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: isScanning ? 'block' : 'none' }} 
              />
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="scanner-view" style={{ position: 'relative', width: '100%', maxWidth: '640px', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', background: '#000', margin: '0 auto' }}>
            <QrScanner 
              onScan={handleQRScan}
              onError={(error) => console.log(error?.message)}
              components={{ finder: true }}
            />
          </div>
        )}
      </div>

      {scanResult && scanResult.success && (
        <div className="scan-result" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgb(34, 197, 94)', color: 'rgb(34, 197, 94)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <CheckCircle size={32} />
          <div>
            <strong>{scanResult.message}</strong>
            {scanResult.student && <div style={{fontSize: '0.9rem', opacity: 0.9}}>Student: {scanResult.student}</div>}
          </div>
        </div>
      )}

      {scanResult && !scanResult.success && (
        <div className="scan-result" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgb(239, 68, 68)', color: 'rgb(239, 68, 68)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <AlertTriangle size={32} />
          <div>
            <strong>Error</strong>
            <div style={{fontSize: '0.9rem', opacity: 0.9}}>{scanResult.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
