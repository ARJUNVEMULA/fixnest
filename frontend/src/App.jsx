import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { API_URL, login, getMe, getBookings, getServices, raiseComplaint, sendOtp, verifyOtp, registerCustomer, getApartments, getBlocks, addApartment, addBlock, triggerScheduler, getWorkers, getAdminWorkers, getAdminCustomers, getAdminAnnouncements, getAdminMaintenance, getAttendance, markAttendance, createVisitorPass, getMyVisitors, verifyVisitorPass, extendVisitorStay, getVisitorStats, getActiveVisitors, getServiceCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory, getServiceBanners, adminCreateBanner, adminDeleteBanner, getServiceStats, adminUpdateStats, uploadFile, adminCreateSubCategory, adminUpdateSubCategory, adminDeleteSubCategory, adminCreateServiceType, adminUpdateServiceType, adminDeleteServiceType, adminCreateExtraService, adminUpdateExtraService, adminDeleteExtraService, getMyWorkerProfile, updateWorkerProfile, getAbsUrl } from './api';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const DICTIONARIES = {
  en: {
    welcome: "Welcome back",
    tagline: "Nest in Comfort — We fix the Rest.",
    overview: "Overview",
    maintenance: "Maintenance",
    visitors: "Visitors",
    parcels: "Parcels",
    profile: "Identity Center",
    personal_info: "Personal Information",
    flat_details: "Flat Details",
    appearance: "Customized Appearance",
    language: "Preferred Language",
    save: "Save Changes",
    edit: "Edit Identity",
    signout: "Sign Out",
    theme_classic: "Classic Nest",
    theme_midnight: "Midnight Stealth",
    theme_sunset: "Vibrant Sunset",
    theme_emerald: "Emerald Garden",
    apartment: "My Apartment",
    payments: "Payments",
    extra_services: "Extra Services",
    feedback: "Feedback",
    contact: "Contact Us"
  },
  hi: {
    welcome: "वापसी पर स्वागत है",
    tagline: "आराम से रहें - हम बाकी सब ठीक कर देंगे।",
    overview: "अवलोकन",
    maintenance: "रखरखाव",
    visitors: "आगंतुक",
    parcels: "पार्सल",
    profile: "पहचान केंद्र",
    personal_info: "व्यक्तिगत जानकारी",
    flat_details: "फ्लैट विवरण",
    appearance: "अनुकूलित रूप",
    language: "पसंद की भाषा",
    save: "बदलाव सहेजें",
    edit: "पहचान बदलें",
    signout: "साइन आउट",
    theme_classic: "क्लासिक नेस्ट",
    theme_midnight: "मिडनाइट स्टेल्थ",
    theme_sunset: "वाइब्रेंट सनसेट",
    theme_emerald: "एमराल्ड गार्डन",
    apartment: "मेरा अपार्टमेंट",
    payments: "भुगतान",
    extra_services: "अतिरिक्त सेवाएं",
    feedback: "फीडबैक",
    contact: "संपर्क करें"
  },
  te: {
    welcome: "తిరిగి స్వాగతం",
    tagline: "హాయిగా ఉండండి — మిగిలినవి మేము చూసుకుంటాము.",
    overview: "అవలోకనం",
    maintenance: "నిర్వహణ",
    visitors: "సందర్శకులు",
    parcels: "పార్శిళ్లు",
    profile: "గుర్తింపు కేంద్రం",
    personal_info: "వ్యక్తిగత సమాచారం",
    flat_details: "ఫ్లాట్ వివరాలు",
    appearance: "అనుకూలీకరించిన రూపం",
    language: "భాష ఎంపిక",
    save: "మార్పులను సేవ్ చేయి",
    edit: "గుర్తింపు సవరించు",
    signout: "సైన్ అవుట్",
    theme_classic: "క్లాసిక్ నెస్ట్",
    theme_midnight: "మిడ్ నైట్ స్టెల్త్",
    theme_sunset: "వైబ్రెంట్ సన్ సెట్",
    theme_emerald: "ఎమరాల్డ్ గార్డెన్",
    apartment: "నా అపార్ట్‌మెంట్",
    payments: "చెల్లింపులు",
    extra_services: "అదనపు సేవలు",
    feedback: "అభిప్రాయం",
    contact: "మమ్మల్ని సంప్రదించండి"
  }
};

const THEMES = {
  default: { primary: '#3b5bdb', secondary: '#eff2ff', bg: '#f8fafc', text: '#1e293b' },
  midnight: { primary: '#8b5cf6', secondary: '#1e293b', bg: '#0f172a', text: '#f8fafc' },
  sunset: { primary: '#f97316', secondary: '#fff7ed', bg: '#fffafb', text: '#431407' },
  emerald: { primary: '#10b981', secondary: '#ecfdf5', bg: '#f0fdf4', text: '#064e3b' }
};

const Auth = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('customer');

  const [signupStep, setSignupStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [signupData, setSignupData] = useState({
    username: '',
    apartment_id: '',
    block: '',
    floor_number: '',
    flat_number: ''
  });

  const [apartments, setApartments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [generatedFlatId, setGeneratedFlatId] = useState('');

  useEffect(() => {
    if (!isLogin && signupStep === 2) {
      getApartments().then(setApartments).catch(console.error);
    }
  }, [isLogin, signupStep]);

  useEffect(() => {
    if (signupData.apartment_id) {
      getBlocks(signupData.apartment_id).then(setBlocks).catch(console.error);
    }
  }, [signupData.apartment_id]);

  useEffect(() => {
    if (signupData.apartment_id && signupData.block && signupData.floor_number && signupData.flat_number) {
      const apt = apartments.find(a => String(a.id) === String(signupData.apartment_id));
      if (apt) {
        const floor = String(signupData.floor_number).padStart(2, '0');
        setGeneratedFlatId(`${apt.code}${signupData.block}${floor}${signupData.flat_number}`);
      }
    } else {
      setGeneratedFlatId('');
    }
  }, [signupData, apartments]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await login(identifier, password);
      localStorage.setItem('fixnest_token', data.access_token);
      localStorage.setItem('fixnest_role', loginRole);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      await sendOtp(mobileNumber);
      alert('OTP sent! (Use 123456 for demo)');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp(mobileNumber, otp);
      setSignupStep(2);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerCustomer({
        mobile_number: mobileNumber,
        username: signupData.username,
        apartment_id: parseInt(signupData.apartment_id),
        block: signupData.block,
        floor_number: parseInt(signupData.floor_number),
        flat_number: parseInt(signupData.flat_number),
        password: password,
        role: role
      });
      setIsLogin(true);
      setError('Account created! Please use your Flat ID / Mobile to login.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const [loginRole, setLoginRole] = useState('customer');

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>FixNest {isLogin ? 'Login' : 'Customer Registration'}</h2>
        {error && <p className={isLogin && error !== 'Account created! Please use your Flat ID / Mobile to login.' ? 'error-text' : 'success-text'}>{error}</p>}

        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {['customer', 'worker', 'admin'].map(r => (
                <button type="button" key={r} onClick={() => setLoginRole(r)} style={{ padding: '0.5rem', flex: 1, borderRadius: '8px', border: loginRole === r ? '2px solid var(--primary)' : '1px solid #ddd', background: loginRole === r ? '#eef2ff' : 'white', cursor: 'pointer', fontWeight: loginRole === r ? 'bold' : 'normal', color: loginRole === r ? 'var(--primary)' : '#555', textTransform: 'capitalize', fontSize: '0.9rem' }}>
                  {r}
                </button>
              ))}
            </div>
            <div className="form-group">
              <label>{loginRole === 'customer' ? 'Flat ID / Mobile' : 'Staff Email ID'}</label>
              <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder={loginRole === 'admin' ? 'e.g. admin@fixnest.com' : (loginRole === 'worker' ? 'e.g. worker0@fixnest.com' : 'Your Flat ID')} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn" disabled={isLoading}>{isLoading ? 'Loading...' : 'Sign In'}</button>
          </form>
        ) : (
          <div>
            {signupStep === 1 && (
              <div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required />
                </div>
                <button className="btn" style={{ marginBottom: '1rem' }} onClick={handleSendOtp}>Send OTP</button>
                <div className="form-group">
                  <label>Enter 6-digit OTP</label>
                  <input type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
                <button className="btn" onClick={handleVerifyOtp} style={{ background: 'var(--primary)' }}>Verify and Continue</button>
              </div>
            )}
            {signupStep === 2 && (
              <form onSubmit={() => setSignupStep(3)}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={signupData.username} onChange={e => setSignupData({ ...signupData, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Apartment</label>
                  <select value={signupData.apartment_id} onChange={e => setSignupData({ ...signupData, apartment_id: e.target.value })} required>
                    <option value="">Select Apartment</option>
                    {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Block</label>
                  <select value={signupData.block} onChange={e => setSignupData({ ...signupData, block: e.target.value })} required disabled={!signupData.apartment_id || blocks.length === 0}>
                    <option value="">Select Block</option>
                    {blocks.map(b => <option key={b.id} value={b.block_name}>{b.block_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Floor No.</label>
                    <input type="number" value={signupData.floor_number} onChange={e => setSignupData({ ...signupData, floor_number: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Flat No.</label>
                    <input type="number" value={signupData.flat_number} onChange={e => setSignupData({ ...signupData, flat_number: e.target.value })} required />
                  </div>
                </div>
                {generatedFlatId && (
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ margin: 0, color: 'gray', fontSize: '0.85rem' }}>Your Unique Flat ID</p>
                    <h3 style={{ margin: '0.2rem 0 0 0', color: 'var(--primary)', letterSpacing: '2px' }}>{generatedFlatId}</h3>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn" style={{ background: 'gray' }} onClick={() => setSignupStep(1)}>Back</button>
                  <button type="submit" className="btn">Next Step</button>
                </div>
              </form>
            )}
            {signupStep === 3 && (
              <form onSubmit={handleSignupSubmit}>
                <div className="form-group">
                  <label>Setup Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn" style={{ background: 'gray' }} onClick={() => setSignupStep(2)}>Back</button>
                  <button type="submit" className="btn" disabled={isLoading} style={{ background: 'var(--success)', opacity: isLoading ? 0.7 : 1 }}>{isLoading ? 'Creating...' : 'Create Profile'}</button>
                </div>
              </form>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: '500' }} onClick={() => { setIsLogin(!isLogin); setSignupStep(1); }}>
          {isLogin ? "Resident without an account? Register Flat" : "Back to Login"}
        </p>
      </div>
    </div>
  );
};

const VisitorManagement = ({ token, user }) => {
  const [visitors, setVisitors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    flat_id: user.flat_id || '',
    visit_date: new Date().toISOString().split('T')[0],
    expected_check_in_time: new Date().toISOString().slice(0, 16),
    expected_check_out_time: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);
  const [activeQR, setActiveQR] = useState(null);
  const [extensionData, setExtensionData] = useState(null); // { id: 1, time: '...' }

  const fetchVisitors = useCallback(() => {
    getMyVisitors(token).then(setVisitors).catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchVisitors();
    const iv = setInterval(fetchVisitors, 8000);
    return () => clearInterval(iv);
  }, [fetchVisitors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = await createVisitorPass(token, form);
      setVisitors([v, ...visitors]);
      setShowForm(false);
      setActiveQR(v);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleExtend = async () => {
    if (!extensionData) return;
    try {
      await extendVisitorStay(token, extensionData.id, extensionData.time);
      setExtensionData(null);
      fetchVisitors();
    } catch (err) { alert(err.message); }
  };

  const statusMap = {
    'Scheduled': { bg: '#fef3c7', color: '#92400e', label: 'SCHEDULED' },
    'Checked-IN': { bg: '#dcfce7', color: '#166534', label: 'ACTIVE' },
    'Checked-OUT': { bg: '#f1f5f9', color: '#475569', label: 'EXITED' },
    'Overstay': { bg: '#fee2e2', color: '#991b1b', label: 'OVERSTAYED' }
  };

  return (
    <div className="vms-container" style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Visitor Pass Management</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Create and track visitor access requests</p>
        </div>
        <button className="cd-save-btn" style={{ padding: '0.6rem 1.2rem', background: '#6366f1', borderRadius: '12px' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '➕ New Entry Pass'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="cd-profile-field">
              <label style={{ fontWeight: 600, color: '#475569' }}>Visitor Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="cd-profile-field">
              <label style={{ fontWeight: 600, color: '#475569' }}>Mobile Number</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="cd-profile-field">
              <label style={{ fontWeight: 600, color: '#475569' }}>Entry Time (Estimated)</label>
              <input type="datetime-local" value={form.expected_check_in_time} onChange={e => setForm({ ...form, expected_check_in_time: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="cd-profile-field">
              <label style={{ fontWeight: 600, color: '#475569' }}>Exit Time (Estimated)</label>
              <input type="datetime-local" value={form.expected_check_out_time} onChange={e => setForm({ ...form, expected_check_out_time: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <button type="submit" className="cd-save-btn" style={{ width: '100%', padding: '1rem', background: '#6366f1', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Securing Access...' : '✅ Generate Digital Pass'}
          </button>
        </form>
      )}

      {activeQR && (
        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '32px', textAlign: 'center', marginBottom: '2.5rem', border: '2px solid #6366f1', boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.1)' }}>
          <div style={{ background: '#6366f1', color: '#fff', display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>SECURITY TOKEN ACTIVATED</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{activeQR.name}</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Share this QR with the visitor for gate entry/exit</p>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', display: 'inline-block' }}>
            <QRCodeCanvas value={`{"secure_token": "${activeQR.secure_token}"}`} size={220} />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <button style={{ color: '#6366f1', background: 'none', border: '1px solid #6366f1', padding: '0.6rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setActiveQR(null)}>Done</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {visitors.map(v => (
          <div key={v.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: statusMap[v.status]?.color || '#cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <strong style={{ color: '#1e293b', fontSize: '1.1rem', display: 'block' }}>{v.name}</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>📞 {v.phone}</span>
              </div>
              <span style={{ fontSize: '0.7rem', background: statusMap[v.status]?.bg || '#f1f5f9', color: statusMap[v.status]?.color || '#475569', padding: '0.3rem 0.75rem', borderRadius: '100px', fontWeight: 800 }}>
                {statusMap[v.status]?.label || v.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>CHECK-IN</label>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>{v.actual_check_in_time ? new Date(v.actual_check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>CHECK-OUT</label>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>{v.actual_check_out_time ? new Date(v.actual_check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(v.visit_date).toLocaleDateString()}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {v.status === 'Scheduled' && (
                  <button className="cd-save-btn" style={{ padding: '0.4rem 0.8rem', background: '#6366f1', fontSize: '0.75rem' }} onClick={() => setActiveQR(v)}>QR Pass</button>
                )}
                {(v.status === 'Checked-IN' || v.status === 'Overstay') && (
                  <button className="cd-save-btn" style={{ padding: '0.4rem 0.8rem', background: '#f59e0b', fontSize: '0.75rem' }} onClick={() => setExtensionData({ id: v.id, time: new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16) })}>Extend Stay</button>
                )}
              </div>
            </div>

            {extensionData?.id === v.id && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>New Check-out Time</label>
                <input type="datetime-local" value={extensionData.time} onChange={e => setExtensionData({ ...extensionData, time: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleExtend} style={{ flex: 1, padding: '0.5rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Extend Now</button>
                  <button onClick={() => setExtensionData(null)} style={{ padding: '0.5rem', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '0.75rem' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ParcelRequests = ({ token, user }) => {
  const [activeTab, setActiveTab] = useState('verification'); // 'verification' | 'parcel'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    delivery_agent_name: '',
    mobile_number: '',
    delivery_app: 'Amazon',
    item_type: '',
    expected_time: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  useEffect(() => {
    getMyDeliveries(token).then(setRequests).catch(console.error);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, mode: activeTab };
      await create_delivery_request(token, payload);
      const updated = await getMyDeliveries(token);
      setRequests(updated);
      setShowForm(false);
      setForm({ delivery_agent_name: '', mobile_number: '', delivery_app: 'Amazon', item_type: '', expected_time: new Date().toISOString().slice(0, 16), notes: '' });
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const create_delivery_request = async (token, data) => {
    const res = await fetch(`${API_URL}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create request");
    return res.json();
  };

  const getMyDeliveries = async (token) => {
    const res = await fetch(`${API_URL}/deliveries/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  };

  return (
    <div className="cd-profile-card" style={{ borderLeft: '4px solid #f97316', background: '#fff', padding: '1.5rem', borderRadius: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="cd-profile-info-title" style={{ margin: 0 }}>Smart Parcel & Delivery Care</h3>
        <button className="cd-save-btn" style={{ padding: '0.5rem 1rem', background: '#f97316', border: 'none', cursor: 'pointer' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : '➕ Pre-Authorize Entry'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#fff7ed', padding: '0.5rem', borderRadius: '12px' }}>
        <button onClick={() => setActiveTab('verification')} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, background: activeTab === 'verification' ? '#f97316' : 'transparent', color: activeTab === 'verification' ? '#fff' : '#f97316', transition: 'all 0.2s' }}>
          🚚 Delivery Entry (I'm Home)
        </button>
        <button onClick={() => setActiveTab('parcel')} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, background: activeTab === 'parcel' ? '#f97316' : 'transparent', color: activeTab === 'parcel' ? '#fff' : '#f97316', transition: 'all 0.2s' }}>
          📦 Hold My Parcel (I'm Away)
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '16px', border: '1px solid #ffedd5', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#c2410c', marginBottom: '1rem' }}>
            {activeTab === 'verification'
              ? "Security will verify this agent before allowing entry to your flat."
              : "Security will collect and securely hold the parcel at the gate until your return."}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="cd-profile-field">
              <label>Delivery Agent Name</label>
              <input value={form.delivery_agent_name} onChange={e => setForm({ ...form, delivery_agent_name: e.target.value })} required placeholder="e.g. Rahul Kumar" />
            </div>
            <div className="cd-profile-field">
              <label>Agent's Mobile</label>
              <input value={form.mobile_number} onChange={e => setForm({ ...form, mobile_number: e.target.value })} required placeholder="For security lookup" />
            </div>
            <div className="cd-profile-field">
              <label>Platform / App</label>
              <select value={form.delivery_app} onChange={e => setForm({ ...form, delivery_app: e.target.value })}>
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Swiggy">Swiggy</option>
                <option value="Zomato">Zomato</option>
                <option value="BigBasket">BigBasket</option>
                <option value="Blinkit">Blinkit</option>
                <option value="Other">Other (Couriers)</option>
              </select>
            </div>
            {activeTab === 'parcel' && (
              <div className="cd-profile-field">
                <label>Item Type</label>
                <input value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value })} placeholder="e.g. Electronics, Clothes" />
              </div>
            )}
            <div className="cd-profile-field">
              <label>Expected Arrival</label>
              <input type="datetime-local" value={form.expected_time} onChange={e => setForm({ ...form, expected_time: e.target.value })} required />
            </div>
          </div>
          <div className="cd-profile-field" style={{ marginBottom: '1rem' }}>
            <label>Specific Instructions for Guard</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Call before accepting, Leave at door etc." style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd' }} />
          </div>
          <button type="submit" className="cd-save-btn" style={{ width: '100%', padding: '0.8rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800 }} disabled={loading}>
            {loading ? 'Transmitting Request...' : '🚀 Notify Security Team'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {requests.filter(r => r.mode === activeTab).map(r => (
          <div key={r.id} style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid #fef3c7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <div>
                <strong style={{ color: '#1f2937' }}>{r.delivery_agent_name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 800, textTransform: 'uppercase' }}>{r.delivery_app}</div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                background: r.status === 'Collected' || r.status === 'Verified' ? '#d1fae5' : r.status === 'Received' ? '#ffedd5' : '#f3f4f6',
                color: r.status === 'Collected' || r.status === 'Verified' ? '#065f46' : r.status === 'Received' ? '#c2410c' : '#6b7280',
                padding: '0.3rem 0.7rem',
                borderRadius: '999px',
                fontWeight: 800,
                boxShadow: r.status === 'Received' ? '0 0 10px rgba(249,115,22,0.2)' : 'none'
              }}>
                {r.status.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <p style={{ margin: 0 }}>📞 {r.mobile_number}</p>
              <p style={{ margin: 0 }}>⏰ ETA: {new Date(r.expected_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              {r.item_type && <p style={{ margin: 0 }}>📦 Type: {r.item_type}</p>}
              {r.otp && r.status === 'Received' && (
                <div style={{ marginTop: '0.75rem', background: '#f97316', color: 'white', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9, display: 'block', marginBottom: '0.2rem' }}>COLLECTION OTP</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '4px' }}>{r.otp}</span>
                </div>
              )}
            </div>

            {r.status === 'Received' && (
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#c2410c', background: '#fff7ed', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                🚨 Parcel is at the Main Gate. Use OTP above to collect.
              </div>
            )}
          </div>
        ))}
        {requests.filter(r => r.mode === activeTab).length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#fafaf9', borderRadius: '16px', border: '1px dashed #e7e5e4', color: '#a8a29e' }}>
            <p style={{ margin: 0 }}>No active {activeTab === 'verification' ? 'entry authorizations' : 'held parcels'} found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SmartDeliveryManagement = ({ token }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpVerifyId, setOtpVerifyId] = useState(null);
  const [otpValue, setOtpValue] = useState('');

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/deliveries/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDeliveries(data);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    fetchDeliveries();
    const iv = setInterval(fetchDeliveries, 10000);
    return () => clearInterval(iv);
  }, [fetchDeliveries]);

  const handleAction = async (id, action) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/deliveries/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ delivery_id: id, action })
      });
      if (!res.ok) throw new Error("Action failed");
      await fetchDeliveries();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/deliveries/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ delivery_id: otpVerifyId, otp: otpValue })
      });
      if (!res.ok) throw new Error("Invalid OTP");
      setOtpVerifyId(null);
      setOtpValue('');
      await fetchDeliveries();
      alert("Parcel handed over successfully!");
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="cd-profile-card" style={{ borderLeft: '4px solid #0ea5e9', background: '#fff', padding: '1.5rem', borderRadius: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="cd-profile-info-title" style={{ margin: 0 }}>Front-Gate Delivery Monitor</h3>
        <button className="cd-save-btn" style={{ padding: '0.5rem 1rem', background: '#0ea5e9' }} onClick={fetchDeliveries}>🔄 Refresh Ledger</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {deliveries.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No active delivery requests at this moment.</p>}
        {deliveries.map(d => (
          <div key={d.id} style={{
            background: d.status === 'Received' ? '#f0f9ff' : 'white',
            padding: '1.2rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{d.delivery_agent_name}</strong>
                <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 800 }}>{d.delivery_app}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>📍 Flat {d.flat_id}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '1rem' }}>
                <span>📞 {d.mobile_number}</span>
                <span>Mode: <strong>{d.mode === 'verification' ? 'Entry Req' : 'Parcel Drop'}</strong></span>
                <span style={{ color: d.status === 'Requested' ? '#f59e0b' : '#0ea5e9', fontWeight: 700 }}>STATUS: {d.status.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {d.status === 'Requested' && (
                <>
                  {d.mode === 'verification' ? (
                    <button onClick={() => handleAction(d.id, 'verify')} className="cd-save-btn" style={{ background: '#10b981' }}>Allow Entry</button>
                  ) : (
                    <button onClick={() => handleAction(d.id, 'receive')} className="cd-save-btn" style={{ background: '#0ea5e9' }}>Log Parcel</button>
                  )}
                  <button onClick={() => handleAction(d.id, 'reject')} className="cd-cancel-btn">Reject</button>
                </>
              )}
              {d.status === 'Received' && (
                <button onClick={() => setOtpVerifyId(d.id)} className="cd-save-btn" style={{ background: '#8b5cf6' }}>Handover Parcel</button>
              )}
              {d.status === 'Verified' && (
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.8rem' }}>ENTRY GRANTED</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {otpVerifyId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Verify Collection OTP</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Enter the 6-digit code shown on the resident's mobile app to confirm handover.</p>
            <form onSubmit={handleOTPVerify}>
              <input
                type="text"
                value={otpValue}
                onChange={e => setOtpValue(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                style={{ width: '100%', padding: '1rem', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '4px', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '1.5rem' }}
                required
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="cd-save-btn" style={{ flex: 1 }}>Verify & Release</button>
                <button type="button" onClick={() => setOtpVerifyId(null)} className="cd-cancel-btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DeliveryAnalytics = ({ token, apartmentsList = [] }) => {
  const [stats, setStats] = useState(null);
  const [filterApt, setFilterApt] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterApp, setFilterApp] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/deliveries/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!stats) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #f3f4f6', borderTopColor: '#3b5bdb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#64748b' }}>Initializing Intelligence Matrix...</p>
    </div>
  );

  const filteredLedger = (stats.recent_activity || []).filter(r => {
    const matchApt = !filterApt || String(r.apartment_id) === filterApt;
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchApp = !filterApp || r.delivery_app === filterApp;
    const dateObj = new Date(r.created_at);
    const matchMonth = !filterMonth || String(dateObj.getMonth() + 1) === filterMonth;
    return matchApt && matchStatus && matchApp && matchMonth;
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* ── HIGH-FIDELITY STATS ── */}
      <div className="cd-stat-row">
        {[
          { label: 'GLOBAL LOGISTICS', val: stats.total, footer: 'Life-time network entries', color: '#1e293b' },
          { label: 'ACTIVE GATEWAY', val: stats.pending_parcels, footer: 'Held at Main Gates', color: '#f97316' },
          { label: 'HANDOVER SUCCESS', val: stats.collected, footer: 'Resolved via OTP', color: '#10b981' },
          { label: 'LOGISTICS DENIED', val: stats.rejected, footer: 'Suspicious / Rejected', color: '#ef4444' }
        ].map((s, idx) => (
          <div key={idx} className="cd-stat-card" style={{ borderTop: `4px solid ${s.color}`, background: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            <p className="cd-stat-label" style={{ letterSpacing: '1px', fontWeight: 800 }}>{s.label}</p>
            <p className="cd-stat-value" style={{ color: s.color, fontSize: '2.2rem', marginBottom: '0.25rem' }}>{s.val}</p>
            <p className="cd-stat-footer" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.footer}</p>
          </div>
        ))}
      </div>

      {/* ── FUTURISTIC COMMAND BAR (FILTERS) ── */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        alignItems: 'end',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)'
      }}>
        <div className="cd-profile-field" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>🏢 Complex Filter</label>
          <select value={filterApt} onChange={e => setFilterApt(e.target.value)} style={{ background: '#fff', borderRadius: '12px', padding: '0.7rem' }}>
            <option value="">All Apartments</option>
            {apartmentsList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="cd-profile-field" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>📅 Logistics Month</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ background: '#fff', borderRadius: '12px', padding: '0.7rem' }}>
            <option value="">Full Year View</option>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="cd-profile-field" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>🛡️ Security Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: '#fff', borderRadius: '12px', padding: '0.7rem' }}>
            <option value="">Any Status</option>
            <option value="Requested">Requested (Pre-Gate)</option>
            <option value="Received">At-Gate (Held)</option>
            <option value="Verified">Verified (Entry)</option>
            <option value="Collected">Collected (Closed)</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="cd-profile-field" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>📱 Delivery Platform</label>
          <select value={filterApp} onChange={e => setFilterApp(e.target.value)} style={{ background: '#fff', borderRadius: '12px', padding: '0.7rem' }}>
            <option value="">All Providers</option>
            {["Amazon", "Flipkart", "Swiggy", "Zomato", "BigBasket", "Blinkit", "Other"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button className="cd-save-btn" style={{ height: '45px', borderRadius: '12px', background: '#1e293b' }} onClick={() => { setFilterApt(''); setFilterMonth(''); setFilterStatus(''); setFilterApp(''); }}>
          ✨ Clear Filters
        </button>
      </div>

      {/* ── LOGISTICS LEDGER ── */}
      <div className="cd-profile-card" style={{ marginTop: '1.5rem', borderRadius: '24px', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <h3 className="cd-profile-info-title" style={{ margin: 0 }}>Tactical Logistics Ledger</h3>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Viewing {filteredLedger.length} of {stats.recent_activity?.length || 0} entries</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1.2rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>UID</th>
                <th style={{ padding: '1.2rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>AGENT / PROVIDER</th>
                <th style={{ padding: '1.2rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>DROP POINT</th>
                <th style={{ padding: '1.2rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>CLASSIFICATION</th>
                <th style={{ padding: '1.2rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>GATEWAY STATUS</th>
                <th style={{ padding: '1.2rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No matching logistics logs found in the intelligence matrix.</td>
                </tr>
              )}
              {filteredLedger.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fbfcfe'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '1.2rem 1.5rem', fontWeight: 800, color: '#3b5bdb' }}>#{r.id}</td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{r.delivery_agent_name}</div>
                    <div style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '999px', display: 'inline-block', fontWeight: 800, marginTop: '0.2rem' }}>{r.delivery_app.toUpperCase()}</div>
                  </td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#475569' }}>{r.apartment_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>📍 Flat {r.flat_id}</div>
                  </td>
                  <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>{r.mode === 'verification' ? 'Personnel Entry' : 'Parcel Inbound'}</td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      background: r.status === 'Collected' || r.status === 'Verified' ? '#dcfce7' : r.status === 'Rejected' ? '#fee2e2' : r.status === 'Received' ? '#ffedd5' : '#f1f5f9',
                      color: r.status === 'Collected' || r.status === 'Verified' ? '#16a34a' : r.status === 'Rejected' ? '#ef4444' : r.status === 'Received' ? '#c2410c' : '#64748b'
                    }}>
                      {r.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{new Date(r.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const QRScanner = ({ token, onComplete }) => {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const [scannerRef, setScannerRef] = useState(null);

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    setError("");
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      setScannerRef(scanner);
      scanner.render(async (decodedText) => {
        try {
          await scanner.clear();
          setScanning(false);
          const res = await verifyVisitorPass(token, decodedText);
          setResult(res);
          if (onComplete) onComplete();
        } catch (err) {
          setError(err.message);
          setScanning(false);
          await scanner.clear();
        }
      }, (err) => { /* ignore */ });
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (scannerRef) {
        scannerRef.clear().catch(e => console.log('Scanner cleanup:', e));
      }
    };
  }, [scannerRef]);

  const resetScanner = async () => {
    if (scannerRef) {
      await scannerRef.clear().catch(() => { });
      setScannerRef(null);
    }
    setResult(null);
    setError("");
    setScanning(false);
  };

  return (
    <div style={{ overflow: 'hidden', padding: '1rem', borderRadius: '20px' }}>
      {!scanning && !result && !error && (
        <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #10b981', borderRadius: '24px', background: '#f0fdf4' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
          <button className="cd-save-btn" style={{ background: '#10b981', padding: '1rem 2.5rem', fontSize: '1rem', border: 'none', color: '#fff', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16,185,129,0.3)' }} onClick={startScanner}>
            Launch Gate Scanner
          </button>
          <p style={{ marginTop: '1.5rem', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>Scan Mobile QR Code for Entry/Exit Clearance</p>
        </div>
      )}

      {scanning && <div id="reader" style={{ width: '100%', maxWidth: '450px', margin: '0 auto', overflow: 'hidden', borderRadius: '24px', border: '4px solid #10b981', background: '#000' }}></div>}

      {(result || error) && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: error ? '#fff1f2' : (result.status === 'approved' ? '#f0fdf4' : '#fff7ed'), borderRadius: '32px', border: `2px solid ${error ? '#fecaca' : '#bbf7d0'}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>{error ? '🚨' : (result.status === 'approved' ? (result.action === 'checkin' ? '🏠' : '👋') : '🛑')}</div>
          <h4 style={{ fontSize: '1.8rem', color: error ? '#991b1b' : (result.status === 'approved' ? '#166534' : '#9a3412'), margin: '0 0 0.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {error ? 'Scan Rejected' : (result.status === 'approved' ? (result.action === 'checkin' ? 'ENTRY APPROVED' : 'EXIT AUTHORIZED') : 'ACCESS DENIED')}
          </h4>
          <div style={{ fontSize: '1.4rem', color: '#1e3a8a', fontWeight: 800, marginBottom: '1rem' }}>{result?.name || 'Unknown Identity'}</div>
          <p style={{ color: '#475569', margin: '0 0 2.5rem', fontSize: '1.1rem', fontWeight: 500 }}>{error || result?.message || (result.action === 'checkin' ? `Welcome! Head to Flat ${result?.flat}` : `Safe travels! Visit logged.`)}</p>
          <button className="cd-save-btn" style={{ padding: '1rem 2.5rem', borderRadius: '14px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }} onClick={resetScanner}>Scan Next Visitor</button>
        </div>
      )}
    </div>
  );
};

const SecurityVMS = ({ token }) => {
  const [activeTab, setActiveTab] = useState('scan'); // scan | active
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActive = useCallback(() => {
    setLoading(true);
    getActiveVisitors(token)
      .then(setActiveVisitors)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (activeTab === 'active') fetchActive();
  }, [activeTab, fetchActive]);

  return (
    <div className="security-vms" style={{ background: '#fff', padding: '2rem', borderRadius: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '14px' }}>
        <button onClick={() => setActiveTab('scan')} style={{ flex: 1, background: activeTab === 'scan' ? '#fff' : 'transparent', color: activeTab === 'scan' ? '#10b981' : '#64748b', border: 'none', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, boxShadow: activeTab === 'scan' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>🛡️ QR GATE CONTROL</button>
        <button onClick={() => setActiveTab('active')} style={{ flex: 1, background: activeTab === 'active' ? '#fff' : 'transparent', color: activeTab === 'active' ? '#10b981' : '#64748b', border: 'none', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, boxShadow: activeTab === 'active' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>🏘️ ACTIVE PRESENCE ({activeVisitors.length})</button>
      </div>

      {activeTab === 'scan' && <QRScanner token={token} onComplete={fetchActive} />}

      {activeTab === 'active' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {activeVisitors.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍃</div>
              <p style={{ color: '#94a3b8', fontWeight: 500 }}>Main gate reports no visitors currently on-site.</p>
            </div>
          )}
          {activeVisitors.map(v => (
            <div key={v.id} style={{ padding: '1.5rem', border: `1.5px solid ${v.status === 'Overstay' ? '#fecaca' : '#e2e8f0'}`, borderRadius: '20px', background: v.status === 'Overstay' ? '#fff1f2' : '#fff', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <strong style={{ color: '#1e293b', fontSize: '1.1rem', display: 'block' }}>{v.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>📍 FLAT {v.flat_id}</span>
                </div>
                <span style={{ fontSize: '0.7rem', background: v.status === 'Overstay' ? '#ef4444' : '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '100px', fontWeight: 800, letterSpacing: '0.5px' }}>{v.status.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <span>📞 {v.phone}</span>
              </div>
              <div style={{ background: v.status === 'Overstay' ? '#fee2e2' : '#f8fafc', padding: '0.75rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#94a3b8' }}>Entered:</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>{new Date(v.actual_check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Expected Exit:</span>
                  <span style={{ color: v.status === 'Overstay' ? '#ef4444' : '#475569', fontWeight: 600 }}>{new Date(v.expected_check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              {v.status === 'Overstay' && (
                <div style={{ marginTop: '1rem', background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
                  ⚠️ OVERSTAY ALERT: Contact Resident
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 1. CUSTOMER PORTAL
const CustomerDashboard = ({ user, token, logout, complaints, reloadBookings }) => {
  const [section, setSection] = React.useState('dashboard');
  const [profile, setProfile] = React.useState({
    username: user.username || '',
    mobile_number: user.mobile_number || '',
    gender: user.gender || 'Not Specified',
    profile_photo: user.profile_photo || '',
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState('');
  const [lang, setLang] = React.useState(localStorage.getItem('fixnest_lang') || 'en');
  const [themeKey, setThemeKey] = React.useState(localStorage.getItem('fixnest_theme') || 'default');

  const t = (key) => DICTIONARIES[lang][key] || key;

  React.useEffect(() => {
    const theme = THEMES[themeKey] || THEMES.default;
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--bg', theme.bg);
    document.documentElement.style.setProperty('--text', theme.text);
    localStorage.setItem('fixnest_theme', themeKey);
  }, [themeKey]);

  React.useEffect(() => {
    localStorage.setItem('fixnest_lang', lang);
    const font = lang === 'te' ? "'Ramabhadra', sans-serif" : "'Outfit', sans-serif";
    document.documentElement.style.setProperty('--font-main', font);
  }, [lang]);

  const [announcements, setAnnouncements] = React.useState([]);

  // Maintenance section state
  const [maintRequests, setMaintRequests] = React.useState([]);
  const [maintForm, setMaintForm] = React.useState({ type: 'plumbing', description: '', urgency: 'normal' });
  const [maintMsg, setMaintMsg] = React.useState('');
  const [myApartmentPlan, setMyApartmentPlan] = React.useState(undefined); // undefined=loading, null=no plan, obj=plan
  const [maintLoading, setMaintLoading] = React.useState(false);

  // RMS State
  const [rmsView, setRmsView] = React.useState('log');
  const [rmsCats, setRmsCats] = React.useState([]);
  const [rmsHistory, setRmsHistory] = React.useState([]);
  const [rmsForm, setRmsForm] = React.useState({ category_id: '', subcategory_id: '', description: '', contact_number: user.mobile_number || '' });
  const [rmsMsg, setRmsMsg] = React.useState("");
  const [selectedRmsFile, setSelectedRmsFile] = React.useState(null);

  // Extra Services State
  const [extraCatsFetch, setExtraCatsFetch] = React.useState([]);
  const [extraBannersFetch, setExtraBannersFetch] = React.useState([]);
  const [extraStatsFetch, setExtraStatsFetch] = React.useState({ rating_value: '4.8', total_customers: '12M+' });

  // Marketplace Navigation State
  const [extraViewMode, setExtraViewMode] = React.useState('grid'); // 'grid', 'subcategory', 'listing'
  const [serviceListingData, setServiceListingData] = React.useState(null);
  const [activeExtraType, setActiveExtraType] = React.useState(null);
  const [activeExtraCat, setActiveExtraCat] = React.useState(null); // Level 1
  const [activeExtraSub, setActiveExtraSub] = React.useState(null); // Level 2
  const [extraCart, setExtraCart] = React.useState([]);
  const [showExtraCartDrawer, setShowExtraCartDrawer] = React.useState(false);
  const [selectedExtraDate, setSelectedExtraDate] = React.useState(null); // format: '2026-03-30'
  const [selectedExtraTime, setSelectedExtraTime] = React.useState(null); // format: '10:00 AM'
  const [lastViewMode, setLastViewMode] = React.useState('grid');

  const handleRazorpayPayment = async (amount, description, onSuccess) => {
    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: "rzp_test_SWlqpqTA6u5DbN", // Replace with your test key from Razorpay dashboard
      amount: amount * 100, // paise
      currency: "INR",
      name: "FixNest Solutions",
      description: description,
      image: "new_logo.png",
      handler: function (response) {
        onSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: user.full_name,
        email: user.email,
        contact: user.mobile_number
      },
      theme: { color: "#6366f1" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  React.useEffect(() => {
    let cancelled = false;
    const fetchMaintData = () => {
      if (section === 'maintenance') {
        import('./api').then(({ getComplaints, getMyMaintenancePlan, getCustomerRMSCategories, getMyRMSRequests }) => {
          getComplaints(token).then(data => { if (!cancelled) setMaintRequests(data); }).catch(console.error);
          getMyMaintenancePlan(token).then(data => { if (!cancelled) setMyApartmentPlan(data); }).catch(() => { if (!cancelled) setMyApartmentPlan(null); });
          getCustomerRMSCategories(token).then(data => { if (!cancelled) setRmsCats(data); }).catch(console.error);
          getMyRMSRequests(token).then(data => { if (!cancelled) setRmsHistory(data); }).catch(console.error);
        });
      }
      if (section === 'extra-services') {
        getServiceCategories().then(data => { if (!cancelled) setExtraCatsFetch(data); }).catch(console.error);
        getServiceBanners().then(data => { if (!cancelled) setExtraBannersFetch(data); }).catch(console.error);
        getServiceStats().then(data => { if (!cancelled) setExtraStatsFetch(data); }).catch(console.error);
      }
    };
    fetchMaintData();
    const pollId = setInterval(fetchMaintData, 10000); // sync every 10s
    return () => { cancelled = true; clearInterval(pollId); };
  }, [section, token]);

  const handleRMSSubmit = async (e) => {
    e.preventDefault();
    setMaintLoading(true);
    try {
      const { raiseRMSRequest, getMyRMSRequests, uploadFile } = await import('./api');

      let imageUrl = null;
      if (selectedRmsFile) {
        const uploadRes = await uploadFile(token, selectedRmsFile);
        imageUrl = uploadRes.url;
      }

      await raiseRMSRequest(token, {
        category_id: parseInt(rmsForm.category_id),
        subcategory_id: parseInt(rmsForm.subcategory_id),
        description: rmsForm.description,
        contact_number: rmsForm.contact_number,
        image_url: imageUrl
      });
      setRmsMsg('✅ Request raised successfully!');
      setRmsForm({ ...rmsForm, description: '' });
      setSelectedRmsFile(null);
      const fresh = await getMyRMSRequests(token);
      setRmsHistory(fresh);
      setTimeout(() => setRmsMsg(''), 4000);
    } catch (err) { alert(err.message); }
    finally { setMaintLoading(false); }
  };

  const handleMaintSubmit = async (e) => {
    e.preventDefault();
    setMaintLoading(true);
    try {
      const { raiseComplaint, getComplaints } = await import('./api');
      await raiseComplaint(token, maintForm.type, maintForm.description);
      setMaintMsg('✅ Request submitted successfully!');
      setMaintForm({ type: 'plumbing', description: '', urgency: 'normal' });
      const updated = await getComplaints(token);
      setMaintRequests(updated);
      setTimeout(() => setMaintMsg(''), 4000);
    } catch (err) { alert(err.message); }
    finally { setMaintLoading(false); }
  };


  React.useEffect(() => {
    let cancelled = false;
    const fetchAnnouncements = () => {
      import('./api').then(({ getAnnouncements }) =>
        getAnnouncements(token)
          .then(data => { if (!cancelled) setAnnouncements(data); })
          .catch(console.error)
      );
    };
    fetchAnnouncements();                          // immediate fetch on mount
    const pollId = setInterval(fetchAnnouncements, 15000); // poll every 15s
    return () => { cancelled = true; clearInterval(pollId); };
  }, [token]);

  const timeAgo = (iso) => {
    // Backend returns naive UTC datetimes — append 'Z' so JS parses as UTC
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile(p => ({ ...p, profile_photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const { updateCustomerProfile } = await import('./api');
      await updateCustomerProfile(token, profile);
      setIsEditing(false);
      setSaveMsg('Profile updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const navTo = (s, e) => { e.preventDefault(); setSection(s); };

  const avatarSrc = profile.profile_photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username || 'R')}&background=c7d2fe&color=1e3a8a&size=200`;

  const Sidebar = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    return (
    <>
      <div className="mobile-top-header">
        <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div className="cd-logo mobile-only-logo">
          <img src="/new_logo.png" alt="FixNest logo" className="cd-logo-img" style={{width: 32, height: 32}} />
          <span className="cd-logo-text" style={{fontSize: '1.2rem', color: '#1e3a8a', fontWeight: 800}}>FixNest</span>
        </div>
      </div>
      
      {isMenuOpen && <div className="mobile-menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>}

      <aside className={`cd-sidebar cd-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="cd-logo desktop-only-logo">
          <img src="/new_logo.png" alt="FixNest logo" className="cd-logo-img" />
          <span className="cd-logo-text">FixNest</span>
        </div>
        
        <div className="drawer-profile-bg">
          <button className="drawer-close-btn" onClick={() => setIsMenuOpen(false)}>&times;</button>
          <img className="cd-profile-avatar" src={avatarSrc} alt="avatar" style={{width: '70px', height: '70px', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', objectFit: 'cover'}} />
          <h3 style={{margin: '0.8rem 0 0.2rem', color: '#fff', fontSize: '1.2rem', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>{profile.username || 'Resident'}</h3>
          <p style={{margin: 0, color: 'rgba(255,255,255,0.95)', fontSize: '0.9rem', fontWeight: 600}}>{profile.mobile_number}</p>
          <p style={{margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem'}}>{user.flat_id || 'Flat 402'} &middot; Resident</p>
        </div>

        <div className="cd-profile-block">
          <img className="cd-profile-avatar" src={avatarSrc} alt="avatar" />
          <div className="cd-profile-text">
            <span className="cd-profile-unit">{user.flat_id || 'Unit 402'} &middot; Premium Wing</span>
            <span className="cd-profile-role">RESIDENT</span>
          </div>
        </div>

        <div className="drawer-search">
          <input type="text" placeholder="Search menu..." />
        </div>

        <nav className="cd-nav" onClick={() => setIsMenuOpen(false)}>
        <a href="#dashboard" onClick={e => navTo('dashboard', e)} className={`cd-nav-item${section === 'dashboard' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          {t('overview')}
        </a>
        <a href="#visitors" onClick={e => navTo('visitors', e)} className={`cd-nav-item${section === 'visitors' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
          {t('visitors')}
        </a>
        <a href="#maintenance" onClick={e => navTo('maintenance', e)} className={`cd-nav-item${section === 'maintenance' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z" /></svg>
          {t('maintenance')}
        </a>
        <a href="#parcels" onClick={e => navTo('parcels', e)} className={`cd-nav-item${section === 'parcels' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /><path d="M12 3v6" /></svg>
          {t('parcels')}
        </a>
        <a href="#payments" onClick={e => navTo('payments', e)} className={`cd-nav-item${section === 'payments' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12l4 2-4 2v-4z"/><circle cx="18" cy="12" r="2"/></svg>
          Payments
        </a>
        <a href="#apartment" className="cd-nav-item">
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /></svg>
          {t('apartment')}
        </a>
        <a href="#payments" className="cd-nav-item">
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          {t('payments')}
        </a>
        <a href="#extra-services" onClick={e => navTo('extra-services', e)} className={`cd-nav-item${section === 'extra-services' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          {t('extra_services')}
        </a>
        <a href="#feedback" className="cd-nav-item">
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          {t('feedback')}
        </a>
        <a href="#profile" onClick={e => navTo('profile', e)} className={`cd-nav-item${section === 'profile' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          {t('profile')}
        </a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); alert('Help Desk: concierge@fixnest.com | 1-800-FIXNEST'); }} className="cd-nav-item">
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          {t('contact')}
        </a>
      </nav>
      <button className="cd-concierge-btn" style={{ marginTop: '0.75rem', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }} onClick={logout}>
        {t('signout')}
      </button>

      <button className="drawer-logout-btn" onClick={logout}>
        LOGOUT <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
      </button>
    </aside>
    </>
  )};

  const Topbar = () => (
    <header className="cd-topbar">
      <div className="cd-topbar-icons">
        <button className="cd-icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        </button>
        {extraCart.length > 0 && (
          <button className="cd-icon-btn" onClick={() => setShowExtraCartDrawer(true)} title="View Cart" style={{ position: 'relative', background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></svg>
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', fontSize: '10px', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{extraCart.length}</span>
          </button>
        )}
        <button className="cd-icon-btn" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
        </button>
        <button className="cd-avatar-btn" onClick={(e) => navTo('profile', e)} title="Go to Profile">
          <img src={avatarSrc} alt="avatar" />
        </button>
      </div>
    </header>
  );

  /* ── PROFILE PAGE ── */
  /* ── MAINTENANCE PAGE ── */
  if (section === 'maintenance') {
    const statusColor = { pending: '#f59e0b', resolved: '#22c55e', cancelled: '#ef4444', escalated: '#8b5cf6' };
    const typeLabel = { plumbing: '🔧 Plumbing', electrical: '⚡ Electrical', cleaning: '🧹 Cleaning', emergency: '🚨 Emergency', safety: '🛡️ Safety', quality: '✅ Quality', billing: '💳 Billing', normal: '📋 General' };
    return (
      <div className="cd-layout">
        <Sidebar />
        <main className="cd-main">
          <Topbar />
          <h2 className="cd-section-title" style={{ marginBottom: '1.5rem' }}>🔧 Maintenance & Requests</h2>

          {/* ── Apartment Maintenance Plan Card ── */}
          {myApartmentPlan === undefined && (
            <div className="cd-profile-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #94a3b8' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading your apartment plan…</p>
            </div>
          )}
          {myApartmentPlan === null && (
            <div className="cd-profile-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b', padding: '1rem 1.5rem' }}>
              <p style={{ color: '#92400e', fontWeight: 600, margin: 0 }}>⚠️ No maintenance plan has been assigned to your apartment yet. Contact the admin.</p>
            </div>
          )}
          {myApartmentPlan && (
            <div className="cd-profile-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b5bdb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 className="cd-profile-info-title" style={{ marginBottom: '0.25rem' }}>🏠 Your Apartment Maintenance Plan</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: myApartmentPlan.plan_name === 'Premium' ? '#fef3c7' : myApartmentPlan.plan_name === 'Standard' ? '#eff2ff' : '#f0fdf4', color: myApartmentPlan.plan_name === 'Premium' ? '#92400e' : myApartmentPlan.plan_name === 'Standard' ? '#3b5bdb' : '#16a34a', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700 }}>
                      {myApartmentPlan.plan_name === 'Premium' ? '⭐ Premium' : myApartmentPlan.plan_name === 'Standard' ? '🔷 Standard' : '🔰 Basic'} Plan
                    </span>
                    <span style={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.95rem' }}>₹{myApartmentPlan.maintenance_charge}<span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.8rem' }}>/month</span></span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {myApartmentPlan.services.map(svc => {
                  const icons = { plumbing: '🔧', electrical: '⚡', cleaning: '🧹', security: '🛡️', general: '📋', sanitation: '🧼', parking: '🅿️', lift: '🛗', solar: '☀️', pools: '🏊', gym: '🏋️', lobby: '🏛️' };
                  const nameSlug = svc.service_name.toLowerCase();
                  return (
                    <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', borderRadius: '12px', background: svc.is_enabled ? '#fff' : '#f8fafc', border: `1.5px solid ${svc.is_enabled ? '#e0e7ef' : '#f1f5f9'}`, boxShadow: svc.is_enabled ? '0 2px 5px rgba(0,0,0,0.02)' : 'none' }}>
                      <div style={{ fontSize: '1.1rem', background: svc.is_enabled ? '#f0f7ff' : '#f1f5f9', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icons[nameSlug] || '⚙️'}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: svc.is_enabled ? '#1e3a8a' : '#94a3b8' }}>{svc.service_name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: svc.is_enabled ? '#22c55e' : '#cbd5e1', boxShadow: svc.is_enabled ? '0 0 5px rgba(34,197,94,0.4)' : 'none' }} />
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: svc.is_enabled ? '#16a34a' : '#94a3b8' }}>{svc.is_enabled ? 'Available' : 'Unavailable'}</span>
                        </div>
                        {svc.sla_time && svc.is_enabled && (
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.62rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {svc.sla_time}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PAY MAINTENANCE SECTION ── */}
          {myApartmentPlan && (
            <div
              style={{
                marginBottom: '2rem', padding: '2rem', borderRadius: '28px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(40px)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    💳 Maintenance Dues
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontWeight: 600 }}>
                    BILLING CYCLE: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </p>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px' }}>₹{myApartmentPlan.maintenance_charge}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.5px' }}>UNPAID</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRazorpayPayment(myApartmentPlan.maintenance_charge, `Maintenance Fee - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, (pid) => {
                    alert(`Payment Successful! Transaction ID: ${pid}. Your maintenance status will be updated shortly.`);
                  })}
                  style={{
                    padding: '1.25rem 3rem', borderRadius: '20px', background: '#6366f1', color: '#fff',
                    border: 'none', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer',
                    boxShadow: '0 15px 35px rgba(99, 102, 241, 0.3)', transition: 'all 0.3s'
                  }}
                  className="hover-lift"
                >
                  Pay Now
                </button>
              </div>
            </div>
          )}


          {/* ── RMS (Request Management System) ── */}
          <div className="cd-profile-card" style={{ borderLeft: '4px solid #3b5bdb', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="cd-profile-info-title" style={{ margin: 0 }}>RMS (Request Management System)</h3>
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
                <button
                  onClick={() => setRmsView('log')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: 'none', background: rmsView === 'log' ? '#fff' : 'transparent', color: rmsView === 'log' ? '#1e3a8a' : '#64748b', boxShadow: rmsView === 'log' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                >Log Request</button>
                <button
                  onClick={() => setRmsView('history')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: 'none', background: rmsView === 'history' ? '#fff' : 'transparent', color: rmsView === 'history' ? '#1e3a8a' : '#64748b', boxShadow: rmsView === 'history' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                >RMS History</button>
              </div>
            </div>

            {rmsView === 'log' ? (
              <form onSubmit={handleRMSSubmit}>
                {rmsMsg && <div className="cd-save-msg" style={{ marginBottom: '1rem' }}>{rmsMsg}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="cd-profile-field">
                    <label>Category</label>
                    <select value={rmsForm.category_id} onChange={e => setRmsForm({ ...rmsForm, category_id: e.target.value, subcategory_id: '' })} required>
                      <option value="">Select Category...</option>
                      {rmsCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="cd-profile-field">
                    <label>Subcategory</label>
                    <select value={rmsForm.subcategory_id} onChange={e => setRmsForm({ ...rmsForm, subcategory_id: e.target.value })} required disabled={!rmsForm.category_id}>
                      <option value="">Select Subcategory...</option>
                      {rmsForm.category_id && rmsCats.find(c => c.id === parseInt(rmsForm.category_id))?.subcategories.map(s => (
                        <option key={s.id} value={s.id}>{s.name} {s.sla_time ? `(${s.sla_time})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="cd-profile-field">
                    <label>Flat Number</label>
                    <input value={user.flat_id || 'N/A'} readOnly style={{ background: '#f8fafc', color: '#64748b' }} />
                  </div>
                  <div className="cd-profile-field">
                    <label>Contact Number (Confirm)</label>
                    <input value={rmsForm.contact_number} onChange={e => setRmsForm({ ...rmsForm, contact_number: e.target.value })} placeholder="Confirm your number" />
                  </div>
                  <div className="cd-profile-field">
                    <label>Attach Photo (Optional)</label>
                    <input type="file" accept="image/*" onChange={e => setSelectedRmsFile(e.target.files[0])} style={{ padding: "7.5px" }} />
                  </div>
                </div>

                <div className="cd-profile-field" style={{ marginBottom: '1.5rem' }}>
                  <label>Brief Description</label>
                  <textarea
                    rows={3}
                    value={rmsForm.description}
                    onChange={e => setRmsForm({ ...rmsForm, description: e.target.value })}
                    placeholder="Describe the issue (e.g. Master bedroom tap leaking since morning)"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e0e7ef', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="cd-save-btn" style={{ padding: '0.75rem 2rem' }} disabled={maintLoading}>
                    {maintLoading ? 'Processing...' : '🚀 Raise Request'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rmsHistory.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>No previous requests found.</p>}
                {rmsHistory.map(r => (
                  <div key={r.id} style={{ padding: '1rem', borderRadius: '14px', border: '1.5px solid #edf2f7', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', display: 'block' }}>#RQ-{r.id}</span>
                        <strong style={{ fontSize: '0.95rem', color: '#1e3a8a' }}>{r.category.name} &rsaquo; {r.subcategory.name}</strong>
                      </div>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800,
                        background: r.status === 'Completed' ? '#dcfce7' : r.status === 'In Progress' ? '#eff6ff' : '#f1f5f9',
                        color: r.status === 'Completed' ? '#16a34a' : r.status === 'In Progress' ? '#3b5bdb' : '#64748b'
                      }}>{r.status.toUpperCase()}</span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#475569' }}>{r.description || 'No description.'}</p>
                    {r.image_url && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <img src={getAbsUrl(r.image_url)} alt="issue" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => window.open(getAbsUrl(r.image_url), "_blank")} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <span>🕒 {timeAgo(r.created_at)}</span>
                      <span style={{ fontWeight: 700, color: r.priority_level === 0 ? '#ef4444' : r.priority_level === 1 ? '#f59e0b' : '#3b5bdb' }}>
                        {r.priority_level === 0 ? 'Urgent' : r.priority_level === 1 ? 'High' : 'Medium'} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legacy Maintenance Requests (Optional - can be moved to a different tab or keep below) */}
          <h3 style={{ color: '#1e3a8a', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>General Complaints & History</h3>
          {maintRequests.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No general complaints logged.</p>
          )}
          {maintRequests.map(r => (
            <div key={r.id} className="cd-profile-card" style={{ marginBottom: '0.9rem', borderLeft: `4px solid ${{ pending: '#f59e0b', resolved: '#22c55e', cancelled: '#ef4444', escalated: '#8b5cf6' }[r.status] || '#94a3b8'}`, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{{ plumbing: '🔧 Plumbing', electrical: '⚡ Electrical', cleaning: '🧹 Cleaning', emergency: '🚨 Emergency', safety: '🛡️ Safety', quality: '✅ Quality', billing: '💳 Billing', normal: '📋 General' }[r.complaint_type] || r.complaint_type}</strong>
                  <span style={{ background: ({ pending: '#f59e0b', resolved: '#22c55e', cancelled: '#ef4444', escalated: '#8b5cf6' }[r.status] || '#94a3b8') + '22', color: { pending: '#f59e0b', resolved: '#22c55e', cancelled: '#ef4444', escalated: '#8b5cf6' }[r.status] || '#64748b', padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {r.status}
                  </span>
                </div>
                <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 0.35rem' }}>{r.description || 'No description provided.'}</p>
                <span style={{ fontSize: '0.77rem', color: '#94a3b8' }}>
                  🗓️ {new Date((r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z')).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  if (section === 'profile') {
    return (
      <div className="cd-layout">
        <Sidebar />
        <main className="cd-main">
          <Topbar />
          <div className="cd-profile-page-header">
            <div>
              <h2 className="cd-profile-page-title">My Profile</h2>
              <p className="cd-profile-page-sub">Manage your personal information and flat details</p>
            </div>
            {!isEditing && (
              <button className="cd-edit-btn" onClick={() => setIsEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit Profile
              </button>
            )}
          </div>
          {saveMsg && (
            <div className="cd-save-msg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              {saveMsg}
            </div>
          )}
          <div className="cd-profile-grid">
            {/* Identity card */}
            <div className="cd-profile-card cd-profile-identity">
              <div className="cd-profile-avatar-wrap">
                <img src={avatarSrc} alt="Profile" className="cd-profile-big-avatar" />
                {isEditing && (
                  <label className="cd-photo-upload-label" title="Change photo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <h3 className="cd-profile-name">{profile.username || 'Resident'}</h3>
              <span className="cd-profile-flat-badge">{user.flat_id || 'N/A'}</span>
              <p className="cd-profile-since">Member since 2024</p>
            </div>
            {/* Info / edit card */}
            <div className="cd-profile-card cd-profile-info-card">
              <h3 className="cd-profile-info-title">Personal Information</h3>
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="cd-profile-form">
                  <div className="cd-profile-field">
                    <label>Full Name</label>
                    <input type="text" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} required />
                  </div>
                  <div className="cd-profile-field">
                    <label>Mobile Number</label>
                    <input type="text" value={profile.mobile_number} onChange={e => setProfile(p => ({ ...p, mobile_number: e.target.value }))} />
                  </div>
                  <div className="cd-profile-field">
                    <label>Gender</label>
                    <select value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Not Specified">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="cd-profile-form-actions">
                    <button type="submit" className="cd-save-btn">Save Changes</button>
                    <button type="button" className="cd-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="cd-profile-view">
                  {[
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, label: 'Full Name', value: profile.username },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 013 4.18 2 2 0 014.18 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>, label: 'Mobile', value: profile.mobile_number },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>, label: 'Gender', value: profile.gender },
                  ].map(r => (
                    <div key={r.label} className="cd-profile-row">
                      <span className="cd-profile-row-label">{r.icon}{r.label}</span>
                      <span className="cd-profile-row-value">{r.value || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Flat card */}
            <div className="cd-profile-card cd-flat-card">
              <h3 className="cd-profile-info-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" style={{ width: 18, height: 18, marginRight: '0.5rem', verticalAlign: 'middle' }}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><rect x="9" y="12" width="6" height="9" /></svg>
                Flat Details
              </h3>
              <div className="cd-flat-grid">
                {[
                  { label: 'Flat ID', value: user.flat_id },
                  { label: 'Apartment ID', value: user.apartment_id },
                  { label: 'Block', value: user.block },
                  { label: 'Floor', value: user.floor_number },
                  { label: 'Flat No.', value: user.flat_number },
                ].map(({ label, value }) => (
                  <div key={label} className="cd-flat-item">
                    <span className="cd-flat-label">{label}</span>
                    <span className="cd-flat-value">{value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Preferences card */}
            <div className="cd-profile-card">
              <h3 className="cd-profile-info-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: 18, height: 18, marginRight: '0.5rem', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                {t('appearance')} & {t('language')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="cd-profile-field">
                  <label>{t('language')}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { k: 'en', l: 'English' }, { k: 'hi', l: 'हिन्दी (Hindi)' }, { k: 'te', l: 'తెలుగు (Telugu)' }
                    ].map(l => (
                      <button
                        key={l.k}
                        onClick={() => setLang(l.k)}
                        style={{
                          flex: 1, padding: '0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                          cursor: 'pointer', border: `1.5px solid ${lang === l.k ? 'var(--primary)' : '#e2e8f0'}`,
                          background: lang === l.k ? 'var(--secondary)' : '#fff', color: lang === l.k ? 'var(--primary)' : '#64748b'
                        }}
                      >
                        {l.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cd-profile-field">
                  <label>{t('appearance')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {Object.entries(THEMES).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => setThemeKey(k)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                          cursor: 'pointer', border: `1.5px solid ${themeKey === k ? 'var(--primary)' : '#e2e8f0'}`,
                          background: themeKey === k ? 'var(--secondary)' : '#fff', color: themeKey === k ? 'var(--primary)' : '#64748b'
                        }}
                      >
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: v.primary }} />
                        {t(`theme_${k}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fetchSubCategories = async (catId) => {
    try {
      const { getServiceCategoryDetail } = await import('./api');
      const data = await getServiceCategoryDetail(catId);
      setActiveExtraCat(extraCatsFetch.find(c => c.id === catId));

      // Group by group_name
      const groups = data.subcategories.reduce((acc, sub) => {
        if (!acc[sub.group_name]) acc[sub.group_name] = [];
        acc[sub.group_name].push(sub);
        return acc;
      }, {});
      setActiveExtraSub(groups);
      setExtraViewMode('subcategory');
    } catch (e) { alert(e.message); }
  };

  const fetchServiceListing = async (subId, subTitle) => {
    try {
      const { getServiceSubCategory } = await import('./api');
      const data = await getServiceSubCategory(subId);

      // Extract types and safely flatten all services
      const types = data.service_types || [];
      const services = [];
      types.forEach(t => {
        if (t.services) services.push(...t.services);
      });

      // Reset filters for new listing
      setActiveExtraType(null);

      setServiceListingData({ subId, subTitle, types, services });
      setExtraViewMode('listing');
    } catch (e) { alert(e.message); }
  };


  const ExtraCartDrawer = () => (
    <>
      {showExtraCartDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', zIndex: 20000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowExtraCartDrawer(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '450px', background: 'rgba(255, 255, 255, 0.9)', height: '100%',
              boxShadow: '-15px 0 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
              animation: 'slideInDrawer 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.4)',
              backdropFilter: 'blur(45px)'
            }}
          >
            <div style={{ padding: '2.5rem 2.22rem', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.3rem', letterSpacing: '-0.5px' }}>Shopping Bag</h2>
                <p style={{ fontSize: '0.88rem', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{extraCart.length} EXQUISITE SERVICES</p>
              </div>
              <button onClick={() => setShowExtraCartDrawer(false)} style={{ background: '#f1f5f9', border: 'none', width: '50px', height: '50px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }} className="hover-lift">
                <svg width="24" height="24" fill="none" stroke="#1e293b" strokeWidth="2.8"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2.22rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollbarWidth: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                {extraCart.length === 0 ? (
                  <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🛍️</div>
                    <p style={{ fontWeight: 900, color: '#64748b', fontSize: '1.1rem' }}>Your bag is empty</p>
                  </div>
                ) : extraCart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1.31rem', padding: '1.36rem', background: '#fff', borderRadius: '24px', border: '1.5px solid #f1f5f9', boxShadow: '0 20px 30px -15px rgba(0,0,0,0.06)', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '18px', background: '#f8fafc', overflow: 'hidden', flexShrink: 0, border: '1px solid #edf2f7' }}>
                      {item.image_url ? <img src={getAbsUrl(item.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>💼</div>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>{item.title}</h4>
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#6366f1' }}>₹{item.price}</span>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{item.duration}</span>
                      </div>
                      <button onClick={() => setExtraCart(extraCart.filter((_, i) => i !== idx))} style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content', opacity: 0.6 }}>REMOVE</button>
                    </div>
                  </div>
                ))}
              </div>

              {extraCart.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '28px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Schedule Professional Arrival
                  </h3>

                  {/* Date Selector */}
                  <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.5rem', marginBottom: '1.8rem' }}>
                    {[...Array(7)].map((_, i) => {
                      const d = new Date(); d.setDate(d.getDate() + i);
                      const dateStr = d.toISOString().split('T')[0];
                      const active = selectedExtraDate === dateStr;
                      return (
                        <div
                          key={i}
                          onClick={() => setSelectedExtraDate(dateStr)}
                          style={{
                            minWidth: '72px', padding: '1rem 0.5rem', borderRadius: '20px', textAlign: 'center', cursor: 'pointer',
                            background: active ? '#6366f1' : '#fff', border: '1.5px solid',
                            borderColor: active ? '#6366f1' : '#e2e8f0', color: active ? '#fff' : '#1e293b',
                            boxShadow: active ? '0 10px 20px rgba(99, 102, 241, 0.25)' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                          }}
                        >
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: active ? 0.9 : 0.6, marginBottom: '0.2rem' }}>{d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{d.getDate()}</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Time Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                    {['09:00 AM', '11:30 AM', '03:00 PM', '06:30 PM'].map(slot => {
                      const active = selectedExtraTime === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedExtraTime(slot)}
                          style={{
                            padding: '0.9rem', borderRadius: '18px', border: '1.5px solid', cursor: 'pointer',
                            background: active ? '#fff' : 'rgba(255,255,255,0.6)',
                            borderColor: active ? '#6366f1' : '#e2e8f0', color: '#1e293b', fontWeight: active ? 900 : 700,
                            boxShadow: active ? '0 8px 15px rgba(0,0,0,0.06)' : 'none',
                            transition: 'all 0.2s', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                          }}
                        >
                          {slot.includes('AM') ? '☀️' : '🌇'} {slot}
                        </button>
                      )
                    })}
                  </div>

                  {selectedExtraDate && selectedExtraTime && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '0.8rem', animation: 'fadeIn 0.3s ease-out' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Service Window Confirmed</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{new Date(selectedExtraDate).toDateString()} &middot; {selectedExtraTime}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '2.5rem 2.22rem', background: '#fff', borderTop: '1.6px solid #f1f5f9', boxShadow: '0 -15px 50px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#64748b' }}>TOTAL INVESTMENT</span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b' }}>₹{extraCart.reduce((s, i) => s + (Number(i.price) || 0), 0)}</span>
              </div>
              <button
                disabled={extraCart.length === 0 || !selectedExtraDate || !selectedExtraTime}
                onClick={() => {
                  const total = extraCart.reduce((s, i) => s + (Number(i.price) || 0), 0);
                  handleRazorpayPayment(total, `Service Booking - ${extraCart.length} items`, (pid) => {
                    alert(`Booking Confirmed! Payment ID: ${pid}. Our worker will arrive on ${new Date(selectedExtraDate).toDateString()} at ${selectedExtraTime}.`);
                    setExtraCart([]);
                    setSelectedExtraDate(null);
                    setSelectedExtraTime(null);
                    setShowExtraCartDrawer(false);
                  });
                }}
                style={{
                  width: '100%', padding: '1.4rem', borderRadius: '24px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4b49ac 100%)',
                  color: '#fff', border: 'none', fontSize: '1.2rem', fontWeight: 900,
                  cursor: (extraCart.length === 0 || !selectedExtraDate || !selectedExtraTime) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
                  opacity: (extraCart.length === 0 || !selectedExtraDate || !selectedExtraTime) ? 0.6 : 1,
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                className="hover-lift"
              >
                {(!selectedExtraDate || !selectedExtraTime) && extraCart.length > 0 ? 'Select Time Slot Above' : 'Secure Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (section === 'extra-services') {
    return (
      <div className="cd-layout">
        <Sidebar />
        <main className="cd-main">
          <Topbar />
          <ExtraCartDrawer />

          {/* LEVEL 1: CATEGORY SELECTION */}
          {extraViewMode === 'grid' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out', paddingBottom: '4rem' }}>
              <h2 className="cd-section-title" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Home services at your doorstep</h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Quality service, delivered with precision.</p>

              <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* LEFT: CATEGORIES BOX */}
                <div style={{
                  background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', flex: '1 1 500px', minWidth: '320px'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '2.0rem' }}>What are you looking for?</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '2.5rem' }}>
                    {extraCatsFetch.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Loading services...</p>}
                    {extraCatsFetch.map(cat => (
                      <div key={cat.id} onClick={() => fetchSubCategories(cat.id)} style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', width: '130px' }} className="hover-lift">
                        <div style={{
                          width: '80px', height: '80px', margin: '0 auto 1.2rem', borderRadius: '20px',
                          background: '#f8fafc', padding: '15px', border: '1.5px solid #edf2f7', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <img src={getAbsUrl(cat.image_url)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={cat.name} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 750, color: '#1e293b', display: 'block', lineHeight: '1.3' }}>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: BANNER GRID */}
                <div style={{
                  flex: '1 1 400px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem',
                }}>
                  {extraBannersFetch.slice(0, 4).map((b) => (
                    <div key={b.id} style={{
                      borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0',
                      boxShadow: '0 15px 30px -5px rgba(0,0,0,0.06)', transition: 'transform 0.3s',
                      aspectRatio: '1/1'
                    }} className="hover-lift">
                      <img src={getAbsUrl(b.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM: STATS */}
              <div style={{ display: 'flex', gap: '4rem', marginTop: '4rem', padding: '2.5rem', borderTop: '1.5px solid #f1f5f9', background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 4px 6px rgba(250, 204, 21, 0.4))' }}>⭐</div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>{extraStatsFetch.rating_value}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Service Rating*</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.4))' }}>👥</div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>{extraStatsFetch.total_customers}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Customers Served*</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 2: FUTURISTIC SUBCATEGORY GLASS MODAL */}
          {extraViewMode === 'subcategory' && activeExtraCat && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(12px)',
              zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'fadeIn 0.3s ease-out'
            }} onClick={() => setExtraViewMode('grid')}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.7)', borderRadius: '40px', padding: '3.5rem',
                maxWidth: '850px', width: '90%', boxShadow: '0 40px 100px -12px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.5)', position: 'relative',
                animation: 'scaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                backdropFilter: 'blur(20px)'
              }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setExtraViewMode('grid')} style={{
                  position: 'absolute', top: '2rem', right: '2rem', width: '36px', height: '36px',
                  borderRadius: '12px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.8)',
                  fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#475569', transition: 'all 0.2s ease'
                }} onMouseOver={e => e.currentTarget.style.background = '#fff'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}>
                  &times;
                </button>

                <div style={{ marginBottom: '3rem' }}>
                  <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>{activeExtraCat.name}</h2>
                  <div style={{ width: '60px', height: '4px', background: 'linear-gradient(to right, #6366f1, #a855f7)', borderRadius: '2px', marginTop: '0.8rem' }}></div>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '12px', scrollbarWidth: 'none' }}>
                  {Object.entries(activeExtraSub).map(([group, subs]) => (
                    <div key={group} style={{ marginBottom: '2.5rem' }}>
                      <h3 style={{ fontSize: '0.7rem', fontWeight: 950, color: '#6366f1', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '3px', opacity: 0.8 }}>{group || 'Available Sub-services'}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                        {subs.map(sub => (
                          <div key={sub.id} onClick={() => fetchServiceListing(sub.id, sub.title)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1rem 1.25rem',
                              background: 'rgba(255, 255, 255, 0.5)', borderRadius: '22px', border: '1px solid rgba(255, 255, 255, 0.4)',
                              cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              boxShadow: '0 8px 15px rgba(0,0,0,0.03)'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.borderColor = '#6366f1';
                              e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(99, 102, 241, 0.2)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.03)';
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem', lineHeight: '1.2', display: 'block' }}>{sub.title}</span>
                            </div>
                            {sub.image_url && (
                              <div style={{ width: '50px', height: '50px', borderRadius: '14px', overflow: 'hidden', background: 'rgba(255,255,255,0.8)', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.5)' }}>
                                <img src={getAbsUrl(sub.image_url)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="sub-icon" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 3: SERVICE LISTING (TWO-PANEL) */}
          {extraViewMode === 'listing' && serviceListingData && (
            <div style={{ animation: 'slideInRight 0.4s ease-out', display: 'flex', gap: '2rem', height: 'calc(100vh - 180px)' }}>
              {/* LEFT: SERVICE TYPES PANEL */}
              <div style={{ width: '280px', flexShrink: 0, background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => setExtraViewMode('subcategory')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer', marginBottom: '1rem', fontSize: '0.9rem' }}>← Back to Subcategories</button>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>{serviceListingData.subTitle}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto' }}>
                  <div
                    onClick={() => setActiveExtraType(null)}
                    style={{
                      padding: '0.85rem 1.25rem', borderRadius: '12px',
                      background: !activeExtraType ? '#6366f1' : '#f8fafc',
                      color: !activeExtraType ? '#fff' : '#1e293b',
                      fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >All Services</div>
                  {serviceListingData.types.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setActiveExtraType(type.id)}
                      style={{
                        padding: '0.85rem 1.25rem', borderRadius: '12px',
                        background: activeExtraType === type.id ? '#6366f1' : '#f8fafc',
                        color: activeExtraType === type.id ? '#fff' : '#1e293b',
                        fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {type.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: SERVICE LIST PANEL */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2rem', scrollbarWidth: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>Available Services</h3>
                  <div style={{ padding: '0.5rem 1.2rem', background: '#eef2ff', color: '#6366f1', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800 }}>
                    Cart: {extraCart.length} Items &middot; ₹{extraCart.reduce((sum, i) => sum + (Number(i.price) || 0), 0)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {serviceListingData.services
                    .filter(s => !activeExtraType || s.type_id === activeExtraType)
                    .map(svc => (
                      <div key={svc.id} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', borderBottom: '1.5px solid #f1f5f9', animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{svc.title}</h4>
                            {svc.is_bestseller && <span style={{ background: '#fff7ed', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 900, padding: '3px 10px', borderRadius: '6px', border: '1px solid #ffedd5' }}>BESTSELLER</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b' }}>⭐ {svc.rating || '4.8'}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b' }}>⏱ {svc.duration}</div>
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '1.2rem' }}>₹{svc.price}</div>
                          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{svc.description}</p>
                        </div>
                        <div style={{ width: '150px', textAlign: 'center' }}>
                          <div style={{
                            width: '120px', height: '120px', borderRadius: '24px', background: '#f8fafc',
                            border: '1.5px solid #edf2f7', marginBottom: '1.2rem', margin: '0 auto', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {svc.image_url ? (
                              <img src={getAbsUrl(svc.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={svc.title} />
                            ) : (
                              <span style={{ fontSize: '2rem' }}>🧰</span>
                            )}
                          </div>
                          <button
                            onClick={() => setExtraCart([...extraCart, svc])}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '15px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', width: '100%', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)', fontSize: '0.9rem' }}
                          >ADD</button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (section === 'parcels') {
    return (
      <div className="cd-layout">
        <Sidebar />
        <main className="cd-main">
          <Topbar />
          <h2 className="cd-section-title" style={{ marginBottom: '1.5rem' }}>📦 Smart Parcel Management</h2>
          <ParcelRequests token={token} user={user} />
        </main>
      </div>
    );
  }

  if (section === 'visitors') {
    return (
      <div className="cd-layout">
        <Sidebar />
        <main className="cd-main">
          <Topbar />
          <h2 className="cd-section-title" style={{ marginBottom: '1.5rem' }}>🏠 Visitor Access Management</h2>
          <VisitorManagement token={token} user={user} />
        </main>
      </div>
    );
  }
  if (section === 'payments') {
    const payments = [
      ...bookings.map(b => ({
        id: `TXN-${b.id}-BK`,
        date: b.date,
        amount: Number(b.price) || 0,
        category: 'Service Booking',
        status: 'Success',
        method: 'Razorpay'
      }))
    ];
    return (
      <div className="cd-layout">
        <Sidebar />
        <main className="cd-main">
          <Topbar />
          <h2 className="cd-section-title" style={{marginBottom:'2rem'}}>🧾 Payment History & Invoices</h2>
          
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'2rem', marginBottom:'3rem'}}>
             <div style={{background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding:'2.2rem', borderRadius:'28px', color:'#fff', boxShadow:'0 20px 40px rgba(15,23,42,0.3)', border:'1px solid rgba(255,255,255,0.05)', position:'relative', overflow:'hidden'}}>
                 <div style={{position:'absolute', right:'-20px', top:'-20px', width:'120px', height:'120px', background:'rgba(255,255,255,0.03)', borderRadius:'50%'}} />
                 <div style={{fontSize:'0.8rem', fontWeight:800, opacity:0.6, marginBottom:'0.6rem', letterSpacing:'1px'}}>EXPENDITURE (MARCH)</div>
                 <div style={{fontSize:'2.8rem', fontWeight:900}}>₹4,450</div>
                 <div style={{marginTop:'1.8rem', height:'8px', background:'rgba(255,255,255,0.1)', borderRadius:'10px', overflow:'hidden'}}>
                    <div style={{width:'68%', height:'100%', background:'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius:'10px'}} />
                 </div>
                 <p style={{fontSize:'0.75rem', marginTop:'1rem', display:'flex', alignItems:'center', gap:'0.4rem', fontWeight:600}}>
                    <span style={{color:'#10b981'}}>- 12%</span> vs last month
                 </p>
             </div>
             <div style={{background:'#fff', padding:'2rem', borderRadius:'28px', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'1.8rem', boxShadow:'0 10px 25px rgba(0,0,0,0.02)'}}>
                 <div style={{width:'72px', height:'72px', background:'#f0fdf4', borderRadius:'22px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', boxShadow:'inset 0 0 15px rgba(34,197,94,0.1)'}}>✅</div>
                 <div>
                    <h4 style={{fontSize:'1.15rem', fontWeight:900, color:'#1e293b', marginBottom:'0.3rem'}}>Status: Healthy</h4>
                    <p style={{fontSize:'0.85rem', color:'#64748b', fontWeight:700}}>All apartment dues fully cleared</p>
                 </div>
             </div>
          </div>

          <div className="cd-profile-card" style={{borderLeft:'4px solid #6366f1'}}>
              <h3 className="cd-profile-info-title" style={{marginBottom:'2rem'}}>Recent Transactions</h3>
              <div style={{overflowX:'auto'}}>
                 <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead>
                       <tr style={{textAlign:'left', borderBottom:'2px solid #f1f5f9'}}>
                          <th style={{padding:'1.2rem', fontSize:'0.75rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>TRANS. REF</th>
                          <th style={{padding:'1.2rem', fontSize:'0.75rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>DATE</th>
                          <th style={{padding:'1.2rem', fontSize:'0.75rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>AMOUNT</th>
                          <th style={{padding:'1.2rem', fontSize:'0.75rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>CATEGORY</th>
                          <th style={{padding:'1.2rem', fontSize:'0.75rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>STATUS</th>
                          <th style={{padding:'1.2rem', textAlign:'right'}}></th>
                       </tr>
                    </thead>
                    <tbody>
                       {payments.length === 0 && (
                          <tr><td colSpan={6} style={{padding:'3rem', textAlign:'center', color:'#94a3b8', fontWeight:700}}>No transactions recorded in your digital vault yet.</td></tr>
                       )}
                       {payments.map(p => (
                          <tr key={p.id} style={{borderBottom:'1px solid #f8fafc'}}>
                             <td style={{padding:'1.4rem 1.2rem', fontSize:'0.85rem', fontWeight:800, color:'#1e293b'}}>{p.id}</td>
                             <td style={{padding:'1.4rem 1.2rem', fontSize:'0.85rem', color:'#64748b', fontWeight:600}}>{new Date(p.date).toLocaleDateString(undefined, {day:'2-digit', month:'short', year:'numeric'})}</td>
                             <td style={{padding:'1.4rem 1.2rem', fontSize:'0.95rem', fontWeight:900, color:'#1e293b'}}>₹{p.amount.toLocaleString()}</td>
                             <td style={{padding:'1.4rem 1.2rem'}}>
                                <span style={{fontSize:'0.65rem', fontWeight:900, padding:'0.4rem 0.8rem', background: p.category==='Maintenance' ? '#eff6ff' : '#f0fdf4', color: p.category==='Maintenance' ? '#3b82f6' : '#10b981', borderRadius:'8px', textTransform:'uppercase'}}>{p.category}</span>
                             </td>
                             <td style={{padding:'1.4rem 1.2rem'}}>
                                <span style={{fontSize:'0.72rem', fontWeight:900, color:'#10b981', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                                   <div style={{width:'8px', height:'8px', background:'#10b981', borderRadius:'50%', boxShadow:'0 0 8px #10b981'}} /> SUCCESSFUL
                                </span>
                             </td>
                             <td style={{padding:'1.4rem 1.2rem', textAlign:'right'}}>
                                <button style={{padding:'0.6rem 1rem', background:'#fff', border:'1.6px solid #e2e8f0', borderRadius:'12px', fontSize:'0.75rem', fontWeight:900, color:'#64748b', cursor:'pointer'}} className="hover-lift">
                                   📥 INVOICE
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── DASHBOARD PAGE ── */
  return (
    <div className="cd-layout">
      <Sidebar />
      <main className="cd-main">
        <Topbar />

        {/* Welcome banner — no Pay Rent / subscription */}
        <section className="cd-banner">
          <div className="cd-banner-text">
            <h1>{t('welcome')}, {profile.username ? profile.username.split(' ')[0] : 'Resident'}</h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem', fontStyle: 'italic', fontWeight: 500 }}>
              {t('tagline')}
            </p>
            <p>
              Flat <strong>{user.flat_id || '—'}</strong> · {user.block ? `Block ${user.block}` : ''} · Floor {user.floor_number || '—'}
            </p>
          </div>
          <button className="cd-pay-btn" onClick={() => navTo('maintenance', { preventDefault: () => { } })}>
            🔧 {t('maintenance')}
          </button>
        </section>

        {/* Stats row — live data */}
        <div className="cd-stat-row">
          <div className="cd-stat-card">
            <p className="cd-stat-label">OPEN REQUESTS</p>
            <p className="cd-stat-value">{maintRequests.filter(r => r.status === 'pending').length} Pending</p>
            <p className="cd-stat-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z" /></svg>
              Updated live
            </p>
          </div>
          <div className="cd-stat-card">
            <p className="cd-stat-label">ANNOUNCEMENTS</p>
            <p className="cd-stat-value">{announcements.length} Active</p>
            <p className="cd-stat-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              {announcements.filter(a => a.priority === 'urgent').length > 0
                ? `${announcements.filter(a => a.priority === 'urgent').length} urgent`
                : 'No urgent alerts'}
            </p>
          </div>
        </div>

        {/* Quick action cards */}
        <h2 className="cd-section-title">Quick Actions</h2>
        <div className="cd-service-grid" style={{ marginBottom: '2rem' }}>
          {[
            { title: 'Raise Request', sub: 'Report plumbing, electrical, or cleaning issues', onClick: () => navTo('maintenance', { preventDefault: () => { } }), svg: <svg viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z" /></svg> },
            { title: 'Extra Services', sub: 'Professional Home Care, Concierge & Lifestyle Services.', onClick: () => navTo('extra-services', { preventDefault: () => { } }), svg: <svg viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> },
            { title: 'Pay Maintenance', sub: 'Manage your apartment dues & maintenance plan', onClick: () => navTo('maintenance', { preventDefault: () => { } }), svg: <svg viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /></svg> },
          ].map(s => (
            <div key={s.title} className="cd-service-card" onClick={s.onClick} style={{ cursor: 'pointer' }}>
              <div className="cd-service-icon">{s.svg}</div>
              <h4>{s.title}</h4><p>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Bottom grid: announcements */}
        <div className="cd-bottom-grid">
          <div className="cd-announcements">
            <div className="cd-announce-header-row">
              <h2 className="cd-section-title" style={{ margin: 0 }}>Recent Announcements</h2>
              <a href="#announcements" className="cd-view-all">View All</a>
            </div>
            <div className="cd-announce-list">
              {announcements.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', padding: '1rem 0' }}>No announcements yet.</p>
              )}
              {announcements.slice(0, 5).map(a => (
                <div key={a.id} className="cd-announce-item" style={a.priority === 'urgent' ? { borderLeft: '3px solid #ef4444', background: '#fff5f5' } : {}}>
                  <div className={`cd-announce-icon ${a.priority === 'urgent' ? 'cd-icon-orange' : 'cd-icon-blue'}`}>
                    {a.priority === 'urgent'
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                    }
                  </div>
                  <div className="cd-announce-body">
                    <div className="cd-announce-meta">
                      <span className="cd-announce-title">
                        {a.priority === 'urgent' && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px', padding: '0.1rem 0.5rem', marginRight: '0.4rem' }}>URGENT</span>}
                        {a.title}
                      </span>
                      <time className="cd-announce-time">{timeAgo(a.created_at)}</time>
                    </div>
                    <p>{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cd-quick-services">
            <h2 className="cd-section-title">Need Help?</h2>
            <div className="cd-help-card">
              <div className="cd-help-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>
              </div>
              <h4>Contact Concierge</h4>
              <p>Our 24/7 support team is here to assist with any apartment inquiries.</p>
              <a href="#chat" className="cd-start-chat">Start Chat</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};



// 2. WORKER PORTAL
const WorkerDashboard = ({ token, bookings, complaints, services, logout }) => {
  const [profile, setProfile] = useState({ name: '', mobile_number: '', gender: 'Male', skills: '', location: 'Downtown' });
  const [isEditing, setIsEditing] = useState(false);
  const [workerAnnouncements, setWorkerAnnouncements] = useState([]);
  const [section, setSection] = useState('overview');

  const timeAgo = (iso) => {
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    getMyWorkerProfile(token).then(p => {
      if (p) setProfile({
        name: p.name || '',
        mobile_number: p.mobile_number || '',
        gender: p.gender || 'Male',
        skills: p.skills || '',
        location: p.location || 'Downtown'
      });
    }).catch(e => console.log("Profile not fully setup"));

    let annCancelled = false;
    const fetchWorkerAnn = () => {
      import('./api').then(({ getAnnouncements }) =>
        getAnnouncements(token)
          .then(data => { if (!annCancelled) setWorkerAnnouncements(data); })
          .catch(console.error)
      );
    };
    fetchWorkerAnn();
    const annPoll = setInterval(fetchWorkerAnn, 15000);
    return () => { annCancelled = true; clearInterval(annPoll); };
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!profile.skills) {
      alert("You MUST explicitly specify your Worker Role!");
      return;
    }
    try {
      await updateWorkerProfile(token, profile);
      setIsEditing(false);
      alert("Worker Identity saved perfectly!");
    } catch (err) {
      alert(err.message);
    }
  };

  const navTo = (s, e) => { e.preventDefault(); setSection(s); };

  const Sidebar = () => (
    <aside className="cd-sidebar">
      <div className="cd-logo" onClick={() => setSection('overview')} style={{ cursor: 'pointer' }}>
        <img src="/new_logo.png" alt="FixNest logo" className="cd-logo-img" />
        <span className="cd-logo-text">FixNest</span>
      </div>
      <div className="cd-profile-block">
        <img className="cd-profile-avatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'W')}&background=1e293b&color=fff&size=200`} alt="avatar" />
        <div className="cd-profile-text">
          <span className="cd-profile-unit" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{profile.location}</span>
          <span className="cd-profile-role">WORKER</span>
        </div>
      </div>
      <nav className="cd-nav">
        <a href="#overview" onClick={e => navTo('overview', e)} className={`cd-nav-item${section === 'overview' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          Overview
        </a>
        <a href="#tasks" onClick={e => navTo('tasks', e)} className={`cd-nav-item${section === 'tasks' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></svg>
          Scheduled Tasks
        </a>
        <a href="#emergencies" onClick={e => navTo('emergencies', e)} className={`cd-nav-item${section === 'emergencies' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          Emergencies
        </a>
        {profile.skills?.toLowerCase() === 'security' && (
          <>
            <a href="#security" onClick={e => navTo('security', e)} className={`cd-nav-item${section === 'security' ? ' cd-nav-active' : ''}`}>
              <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Security Scanner
            </a>
            <a href="#logistics" onClick={e => navTo('logistics', e)} className={`cd-nav-item${section === 'logistics' ? ' cd-nav-active' : ''}`}>
              <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16h6M12 16h.01M20 21v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4M12 8l-4-4-4 4M8 12V4" /></svg>
              Smart Delivery
            </a>
          </>
        )}
        <a href="#profile" onClick={e => navTo('profile', e)} className={`cd-nav-item${section === 'profile' ? ' cd-nav-active' : ''}`}>
          <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Identity Center
        </a>
      </nav>
      <button className="cd-concierge-btn" style={{ marginTop: '0.75rem', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }} onClick={logout}>Sign Out</button>
    </aside>
  );

  const Topbar = () => (
    <header className="cd-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>STATUS:</span>
        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>ON-DUTY</span>
      </div>
      <div className="cd-topbar-icons">
        <button className="cd-icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        </button>
        <button className="cd-avatar-btn" onClick={(e) => navTo('profile', e)} title="Worker Identity">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'W')}&background=c7d2fe&color=1e3a8a&size=200`} alt="avatar" />
        </button>
      </div>
    </header>
  );

  return (
    <div className="cd-layout">
      <Sidebar />
      <main className="cd-main">
        <Topbar />

        {section === 'overview' && (
          <>
            <section className="cd-banner" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
              <div className="cd-banner-text">
                <h1>Active Duty: {profile.name || "Worker"}</h1>
                <p>Role: <strong>{(profile.skills || 'Unassigned').toUpperCase()}</strong> &middot; Cluster: <strong>{profile.location}</strong></p>
              </div>
            </section>

            <div className="cd-stat-row">
              <div className="cd-stat-card">
                <p className="cd-stat-label">PENDING TASKS</p>
                <p className="cd-stat-value">{bookings.filter(b => b.status === 'pending').length}</p>
                <p className="cd-stat-footer" style={{ color: '#f59e0b' }}>Requires attention</p>
              </div>
              <div className="cd-stat-card">
                <p className="cd-stat-label">EMERGENCIES</p>
                <p className="cd-stat-value" style={{ color: '#ef4444' }}>{complaints.filter(c => c.status !== 'resolved').length}</p>
                <p className="cd-stat-footer" style={{ color: '#ef4444' }}>High priority</p>
              </div>
              <div className="cd-stat-card">
                <p className="cd-stat-label">DUTY HOURS</p>
                <p className="cd-stat-value">08:00</p>
                <p className="cd-stat-footer" style={{ color: '#16a34a' }}>Active shift</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              <div>
                <h2 className="cd-section-title">Latest Assignments</h2>
                <div className="grid-cards" style={{ gridTemplateColumns: '1fr' }}>
                  {bookings.slice(0, 3).map(b => (
                    <div key={b.id} className="card" style={{ borderLeft: '5px solid #3b5bdb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Ticket #{b.id}</h3>
                        <span className={`status-badge status-${b.status}`}>{b.status}</span>
                      </div>
                      <p><strong>Service:</strong> {String(b.service_id).toUpperCase()}</p>
                      <p><strong>Location:</strong> {b.location}</p>
                      <button className="btn" style={{ marginTop: '1rem' }} onClick={() => setSection('tasks')}>View Details</button>
                    </div>
                  ))}
                  {bookings.length === 0 && <p style={{ color: '#94a3b8' }}>No scheduled tasks for today.</p>}
                </div>
              </div>
              <div>
                <h2 className="cd-section-title">📢 Broadcasts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workerAnnouncements.slice(0, 3).map(a => (
                    <div key={a.id} className="cd-profile-card" style={{ padding: '1rem', borderLeft: `4px solid ${a.priority === 'urgent' ? '#ef4444' : '#3b5bdb'}` }}>
                      <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>{a.title}</strong>
                      <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{a.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {section === 'tasks' && (
          <>
            <h2 className="cd-section-title">Workload Management</h2>
            <div className="grid-cards">
              {bookings.length === 0 && <p style={{ color: 'gray' }}>You have no assigned jobs.</p>}
              {bookings.map(b => (
                <div key={b.id} className="card" style={{ borderLeft: '4px solid #3b5bdb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3>Service Ticket #{b.id}</h3>
                    <span className={`status-badge status-${b.status}`}>{b.status}</span>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <p><strong>Service:</strong> {b.service_id}</p>
                    <p><strong>Scheduled:</strong> {b.date}</p>
                    <p><strong>Slot:</strong> {b.time_slot}</p>
                    <p><strong>Location:</strong> {b.location}</p>
                  </div>
                  <button className="btn" style={{ background: 'var(--success)', marginTop: '1.5rem', width: '100%' }} onClick={() => alert('Demo locked')}>Mark as Completed</button>
                </div>
              ))}
            </div>
          </>
        )}

        {section === 'emergencies' && (
          <>
            <h2 className="cd-section-title" style={{ color: '#e11d48' }}>🚨 Emergency Containment</h2>
            <div className="grid-cards">
              {complaints.length === 0 && <p style={{ color: 'gray' }}>No active emergencies in your queue.</p>}
              {complaints.map(c => (
                <div key={c.id} className="card" style={{ borderLeft: '5px solid #e11d48', background: '#fff1f2' }}>
                  <h3>Incident #{c.id}</h3>
                  <span className={`status-badge status-${c.status}`}>{c.status}</span>
                  <p style={{ marginTop: "1rem" }}><strong>Type:</strong> {c.complaint_type.toUpperCase()}</p>
                  <p><strong>Description:</strong> {c.description}</p>
                  <p style={{ color: '#be123c', fontWeight: 'bold', marginTop: '0.5rem' }}>Priority: {String(c.priority).toUpperCase()}</p>
                  <button className="btn" style={{ background: '#be123c', marginTop: '1.5rem', width: '100%' }} onClick={() => alert('Incident log locked.')}>Acknowledge & Resolve</button>
                </div>
              ))}
            </div>
          </>
        )}

        {section === 'security' && (
          <>
            <h2 className="cd-section-title">🛡️ Front-Gate Security</h2>
            {profile.skills?.toLowerCase() === 'security' ? (
              <SecurityVMS token={token} />
            ) : (
              <p>You do not have security clearance. Access denied.</p>
            )}
          </>
        )}

        {section === 'logistics' && (
          <>
            <h2 className="cd-section-title">🚚 Smart Delivery Management</h2>
            {profile.skills?.toLowerCase() === 'security' ? (
              <SmartDeliveryManagement token={token} />
            ) : (
              <p>Delivery management is restricted to Security personnel.</p>
            )}
          </>
        )}



        {section === 'profile' && (
          <>
            <h2 className="cd-section-title">Worker Identity Management</h2>
            <div className="cd-profile-card">
              {isEditing ? (
                <form onSubmit={handleUpdate} className="cd-profile-form">
                  <div className="cd-profile-field">
                    <label>Full Legal Name</label>
                    <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="cd-profile-field" style={{ flex: 1 }}>
                      <label>Mobile Number</label>
                      <input value={profile.mobile_number} onChange={e => setProfile({ ...profile, mobile_number: e.target.value })} required />
                    </div>
                    <div className="cd-profile-field" style={{ flex: 1 }}>
                      <label>Gender</label>
                      <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="cd-profile-field">
                    <label>Designated Specialization (Role)</label>
                    <select value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })} required>
                      <option value="">-- Choose Role --</option>
                      {!services.some(s => s.category.toLowerCase() === 'security') && <option value="security">Security</option>}
                      {[...new Set(services.map(s => s.category))].map(cat => (
                        <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cd-profile-field">
                    <label>Assigned Operational Cluster</label>
                    <select value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })}>
                      <option>Downtown</option>
                      <option>Northside</option>
                      <option>Westside</option>
                      <option>Eastside</option>
                    </select>
                  </div>
                  <div className="cd-profile-form-actions">
                    <button type="submit" className="cd-save-btn">Save Identity</button>
                    <button type="button" className="cd-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'W')}&background=c7d2fe&color=1e3a8a&size=200`} style={{ width: '120px', borderRadius: '20px' }} alt="worker" />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 1rem 0", color: "#1e293b", fontSize: '1.5rem' }}>{profile.name || "Worker Name Not Set"}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <p><strong>Primary Role:</strong> {(profile.skills || 'Not Configured').toUpperCase()}</p>
                      <p><strong>Duty Cluster:</strong> {profile.location}</p>
                      <p><strong>Gender:</strong> {profile.gender}</p>
                      <p><strong>Contact:</strong> {profile.mobile_number || "None"}</p>
                    </div>
                    <button className="cd-save-btn" style={{ marginTop: "1.5rem" }} onClick={() => setIsEditing(true)}>Edit Identity Details</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const VisitorAnalytics = ({ token }) => {
  const [activeInternalTab, setActiveInternalTab] = useState('insights'); // insights | logs
  const [stats, setStats] = useState(null);
  const [allVisitors, setAllVisitors] = useState([]);
  const [filters, setFilters] = useState({ flat_id: '', status: '' });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getVisitorStats(token);
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await getAllVisitors(token, filters.flat_id, filters.status);
      setAllVisitors(logs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, filters.flat_id, filters.status]);

  useEffect(() => {
    if (activeInternalTab === 'insights') fetchStats();
    else fetchLogs();
  }, [activeInternalTab, fetchStats, fetchLogs]);

  return (
    <div className="analytics-hub" style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '32px', border: '1px solid #e2e8f0', minHeight: '80vh' }}>
      {/* High-Tech Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', background: '#e2e8f0', padding: '0.4rem', borderRadius: '18px', maxWidth: '440px' }}>
        <button
          onClick={() => setActiveInternalTab('insights')}
          style={{
            flex: 1, padding: '0.8rem', borderRadius: '14px', border: 'none',
            background: activeInternalTab === 'insights' ? '#fff' : 'transparent',
            color: activeInternalTab === 'insights' ? '#6366f1' : '#64748b',
            fontWeight: 800, cursor: 'pointer',
            boxShadow: activeInternalTab === 'insights' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          📊 NEURAL INSIGHTS
        </button>
        <button
          onClick={() => setActiveInternalTab('logs')}
          style={{
            flex: 1, padding: '0.8rem', borderRadius: '14px', border: 'none',
            background: activeInternalTab === 'logs' ? '#fff' : 'transparent',
            color: activeInternalTab === 'logs' ? '#6366f1' : '#64748b',
            fontWeight: 800, cursor: 'pointer',
            boxShadow: activeInternalTab === 'logs' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          📋 MASTER VISITOR LOGS
        </button>
      </div>

      {loading && !stats && activeInternalTab === 'insights' && (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div style={{ width: '60px', height: '60px', background: '#6366f1', borderRadius: '50%', margin: '0 auto', opacity: 0.2, animation: 'pulse 1.5s infinite' }}></div>
          <p style={{ marginTop: '1.5rem', color: '#64748b', fontWeight: 600 }}>Synthesizing Analytics...</p>
        </div>
      )}

      {activeInternalTab === 'insights' && stats && (
        <div className="fade-in">
          {/* Vitals Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', padding: '2rem', borderRadius: '28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.1 }}>⏱️</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.5rem', letterSpacing: '1px' }}>AVG STAY TIME</div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900 }}>{stats.efficiency.avg_stay_minutes}<span style={{ fontSize: '1rem', marginLeft: '5px' }}>min</span></div>
              <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginTop: '1rem', fontWeight: 600 }}>Active Efficiency Mapping</div>
            </div>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '1px' }}>PEAK TRAFFIC WINDOW</div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#1e293b' }}>{stats.efficiency.peak_hour}:00</div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, marginTop: '1rem' }}>↑ Highest Arrival Density</div>
            </div>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '1px' }}>DAILY THROUGHPUT</div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#1e293b' }}>{stats.summary.total_today}</div>
              <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 700, marginTop: '1rem' }}>Total Unique Entries</div>
            </div>
          </div>

          {/* Futuristic Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
            {/* Hourly Distribution Bar Graph */}
            <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '32px', border: '1.5px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 2rem 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                24-Hour Intensity Map
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Arrivals per Hour</span>
              </h4>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '180px', background: 'linear-gradient(transparent 98%, #f1f5f9 98%, #f1f5f9 100%)', padding: '0 5px' }}>
                {stats.hourly_distribution.map((count, h) => (
                  <div key={h} style={{
                    flex: 1,
                    background: count === Math.max(...stats.hourly_distribution) && count > 0 ? 'linear-gradient(to top, #4f46e5, #818cf8)' : (count > 0 ? '#cbd5e1' : '#f8fafc'),
                    height: `${(count / (Math.max(...stats.hourly_distribution) || 1)) * 100}%`,
                    minHeight: '4px',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}>
                    {count > 0 && <div className="bar-val" style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', fontWeight: 900, color: '#6366f1' }}>{count}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Top Apartments Analysis */}
            <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '32px', border: '1.5px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 2rem 0', color: '#1e293b', fontSize: '1.2rem' }}>High Traffic Segments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {stats.top_flats.slice(0, 6).map((f, i) => (
                  <div key={f.flat} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i < 3 ? '#6366f1' : '#cbd5e1' }}></div>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>FLAT {f.flat}</span>
                    <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(f.count / stats.top_flats[0].count) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #c7d2fe)', height: '100%' }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', width: '25px', textAlign: 'right' }}>{f.count}</span>
                  </div>
                ))}
                {stats.top_flats.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem', fontSize: '0.9rem' }}>No traffic packets detected.</p>}
              </div>
            </div>
          </div>

          {/* Status Radar Summary */}
          <div style={{ marginTop: '2rem', background: '#fff', padding: '1.5rem 2.5rem', borderRadius: '32px', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '3rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0 }}>Access Distribution</div>
            <div style={{ display: 'flex', flex: 1, gap: '2rem' }}>
              {Object.entries(stats.status_distribution).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: status === 'Overstay' ? '#ef4444' : (status === 'Checked-IN' ? '#10b981' : '#6366f1') }}></div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{count} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.75rem' }}>{status}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeInternalTab === 'logs' && (
        <div className="fade-in">
          {/* Filter Suite */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vector Search (Flat ID)</label>
              <input
                placeholder="Search Location... (e.g. NRA05503)"
                value={filters.flat_id}
                onChange={e => setFilters({ ...filters, flat_id: e.target.value })}
                style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 500 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operational Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
                style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 600, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">All Vectors</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Checked-IN">Active (Entry Logged)</option>
                <option value="Checked-OUT">Cleared (Exit Logged)</option>
                <option value="Overstay">Overstay Escalated</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={fetchLogs} style={{ padding: '0.85rem 1.5rem', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.target.style.background = '#000'} onMouseOut={e => e.target.style.background = '#1e293b'}>SYNC REGISTRY</button>
            </div>
          </div>

          {/* Futuristic Registry Table */}
          <div style={{ background: '#fff', borderRadius: '32px', overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Visitor Identity</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Flat</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Temporal Stamp (Entry/Exit)</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Vector</th>
                  </tr>
                </thead>
                <tbody>
                  {allVisitors.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', background: v.status === 'Overstay' ? '#fff1f2' : 'transparent' }} className="hover-row">
                      <td style={{ padding: '1.5rem' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{v.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>📞 {v.phone}</div>
                      </td>
                      <td style={{ padding: '1.5rem' }}>
                        <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '12px', display: 'inline-block', fontWeight: 800, color: '#1e293b', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                          {v.flat_id}
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                            <span style={{ color: '#94a3b8', marginRight: '10px', fontWeight: 800, fontSize: '0.65rem' }}>ENTRY</span>
                            {v.actual_check_in_time ? new Date(v.actual_check_in_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'NOT LOGGED'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                            <span style={{ color: '#94a3b8', marginRight: '10px', fontWeight: 800, fontSize: '0.65rem' }}>EXIT</span>
                            {v.actual_check_out_time ? new Date(v.actual_check_out_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (v.status === 'Checked-IN' || v.status === 'Overstay' ? 'ON SITE NOW' : 'NOT LOGGED')}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.4rem 1.25rem',
                          borderRadius: '100px',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          background: v.status === 'Overstay' ? '#ef4444' : (v.status === 'Checked-IN' ? '#10b981' : (v.status === 'Scheduled' ? '#f59e0b' : '#f1f5f9')),
                          color: '#fff',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          letterSpacing: '0.5px'
                        }}>
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {allVisitors.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" style={{ padding: '6rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.3 }}>🔍</div>
                        <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '1.1rem' }}>No registry matches for the selected vector.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// 3. ADMIN PORTAL (ENHANCED CALENDAR & TRACKING UX)
const AdminDashboard = ({ token, complaints, bookings = [], reloadBookings, logout }) => {
  const [adminMsg, setAdminMsg] = useState("");
  const [workers, setWorkers] = useState([]);
  const [adminView, setAdminView] = useState("overview");

  // Advanced Bulk Selection logic natively integrated
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [confirmDeleteBox, setConfirmDeleteBox] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  // Custom Controllable Date Input Tracker explicitly managed natively!
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [adminWorkers, setAdminWorkers] = useState([]);
  const [adminCustomers, setAdminCustomers] = useState([]);
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', message: '', target_audience: 'all', priority: 'normal', expiry_date: '' });
  const [annMsg, setAnnMsg] = useState('');

  // Apartment Maintenance state
  const [adminMaintData, setAdminMaintData] = useState([]);
  const [selectedAptForPlan, setSelectedAptForPlan] = useState(null); // { apartment_id, apartment_name, plan }
  const [planForm, setPlanForm] = useState({ plan_name: 'Basic', maintenance_charge: 0 });
  const [planMsg, setPlanMsg] = useState('');
  const [svcForm, setSvcForm] = useState({ service_name: '', sla_time: '', is_enabled: true });
  const [editingSvcId, setEditingSvcId] = useState(null);
  const [showSvcForm, setShowSvcForm] = useState(false);
  const SERVICE_LIST = ['plumbing', 'electrical', 'cleaning', 'security', 'general'];
  const SERVICE_ICONS = { plumbing: '🔧', electrical: '⚡', cleaning: '🧹', security: '🛡️', general: '📋' };

  // Apartment Management State
  const [aptName, setAptName] = useState("");
  const [aptCode, setAptCode] = useState("");
  const [blockAptId, setBlockAptId] = useState("");
  const [blockName, setBlockName] = useState("");
  const [apartmentsList, setApartmentsList] = useState([]);

  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', email: '', mobile_number: '', password: '', gender: 'Male', skills: '', location: '' });
  const [availableDepts, setAvailableDepts] = useState([]);
  const [availableClusters, setAvailableClusters] = useState([]);
  const [workerSubView, setWorkerSubView] = useState('list'); // 'list' | 'depts' | 'clusters'
  const [newDeptName, setNewDeptName] = useState("");
  const [newClusterName, setNewClusterName] = useState("");

  // RMS State
  const [rmsCats, setRmsCats] = useState([]);
  const [rmsRequests, setRmsRequests] = useState([]);
  const [rmsAptMappings, setRmsAptMappings] = useState({}); // { [aptId]: { [catId]: bool } }
  const [selectedAptForRMS, setSelectedAptForRMS] = useState(null);
  const [rmsMsg, setRmsMsg] = useState("");
  const [catForm, setCatForm] = useState({ name: "" });
  const [subForm, setSubForm] = useState({ name: "", priority_level: 2, category_id: null, sla_time: "" });
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, type: null, id: null, name: "" });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilterLocation, setCustomerFilterLocation] = useState("");

  // Extra Services Management State
  const [extraCats, setExtraCats] = useState([]);
  const [extraBanners, setExtraBanners] = useState([]);
  const [extraStats, setExtraStats] = useState({ rating_value: '4.8', total_customers: '12M+' });
  const [extraMsg, setExtraMsg] = useState('');
  const [extraForm, setExtraForm] = useState({ name: '', image_url: '', is_active: true });
  const [editingExtraCatId, setEditingExtraCatId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsForm, setStatsForm] = useState({ rating_value: '4.8', total_customers: '12M+' });
  const [showExtraCatModal, setShowExtraCatModal] = useState(false);
  const [showExtraSubModal, setShowExtraSubModal] = useState(false);
  const [showExtraTypeModal, setShowExtraTypeModal] = useState(false);
  const [showExtraSvcModal, setShowExtraSvcModal] = useState(false);

  // Nested Admin Hierarchy State
  const [adminSelectedCat, setAdminSelectedCat] = useState(null);
  const [adminSelectedSub, setAdminSelectedSub] = useState(null);
  const [adminSelectedType, setAdminSelectedType] = useState(null);
  const [adminSubCats, setAdminSubCats] = useState([]);
  const [adminTypes, setAdminTypes] = useState([]);
  const [adminServices, setAdminServices] = useState([]);
  const [extraAdminTab, setExtraAdminTab] = useState('design'); // 'design' or 'architecture'

  const [subFormExtra, setSubFormExtra] = useState({ group_name: '', title: '', display_order: 0, image_url: '' });
  const [typeFormExtra, setTypeFormExtra] = useState({ name: '', display_order: 0, image_url: '' });
  const [serviceFormExtra, setServiceFormExtra] = useState({ title: '', description: '', price: 0, duration: '', rating: '5.0', review_count: '0', is_bestseller: false, display_order: 0, image_url: '' });
  const [editingExtraSubId, setEditingExtraSubId] = useState(null);
  const [editingExtraTypeId, setEditingExtraTypeId] = useState(null);
  const [editingExtraSvcId, setEditingExtraSvcId] = useState(null);

  useEffect(() => {
    getWorkers(token).then(setWorkers).catch(e => console.error(e));
  }, [token]);

  useEffect(() => {
    if (adminView === "attendance" || adminView === "overview") {
      getAttendance(token, targetDate).then(setAttendanceRecords).catch(console.error);
    }
    if (adminView === "workers") {
      import('./api').then(({ getAdminWorkers }) => getAdminWorkers(token).then(setAdminWorkers).catch(e => alert(e.message)));
    }
    if (adminView === "customers") {
      import('./api').then(({ getAdminCustomers }) => getAdminCustomers(token).then(setAdminCustomers).catch(e => alert(e.message)));
    }
    if (adminView === "apartments") {
      import('./api').then(({ getApartments }) => getApartments().then(setApartmentsList).catch(console.error));
    }
    if (adminView === "announcements") {
      import('./api').then(({ getAdminAnnouncements }) => getAdminAnnouncements(token).then(setAdminAnnouncements).catch(console.error));
    }
    if (adminView === "apt-maintenance" || adminView === "payments") {
      import('./api').then(({ getAdminMaintenance }) => getAdminMaintenance(token).then(setAdminMaintData).catch(console.error));
    }
    if (adminView === "extra_management") {
      getServiceCategories().then(setExtraCats).catch(console.error);
      getServiceBanners().then(setExtraBanners).catch(console.error);
      getServiceStats().then(setExtraStats).catch(console.error);
    }
  }, [adminView, token, targetDate]);

  useEffect(() => {
    if (adminView === 'workers') {
      import('./api').then(({ getDepartments, getClusters }) => {
        getDepartments().then(setAvailableDepts).catch(console.error);
        getClusters().then(setAvailableClusters).catch(console.error);
      });
    }
  }, [adminView, workerSubView]);

  useEffect(() => {
    if (adminWorkers && adminWorkers.length > 0) {
      const extantClusters = adminWorkers.map(w => w.location).filter(Boolean).map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());
      setAvailableClusters(prev => [...new Set([...prev, ...extantClusters])]);
    }
  }, [adminWorkers]);

  useEffect(() => {
    let cancelled = false;
    const fetchRmsData = () => {
      if (adminView === "rms") {
        import('./api').then(({ getAdminRMSCategories, getAdminRMSRequests, getApartments }) => {
          getAdminRMSCategories(token).then(data => { if (!cancelled) setRmsCats(data); }).catch(console.error);
          getAdminRMSRequests(token).then(data => { if (!cancelled) setRmsRequests(data); }).catch(console.error);
          getApartments().then(data => { if (!cancelled) setApartmentsList(data); }).catch(console.error);
        });
      }
    };
    fetchRmsData();
    const pollId = setInterval(fetchRmsData, 10000); // 10s auto sync
    return () => { cancelled = true; clearInterval(pollId); };
  }, [adminView, token, targetDate]);

  useEffect(() => {
    if (adminView === 'rms' && selectedAptForRMS) {
      import('./api').then(({ getApartmentRMSMappings }) => {
        getApartmentRMSMappings(token, selectedAptForRMS.id)
          .then(m => setRmsAptMappings(prev => ({ ...prev, [selectedAptForRMS.id]: m })))
          .catch(console.error);
      });
    }
  }, [adminView, selectedAptForRMS, token]);

  const timeAgo = (iso) => {
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const { createAnnouncement, getAdminAnnouncements } = await import('./api');
      const payload = { ...newAnn, expiry_date: newAnn.expiry_date ? new Date(newAnn.expiry_date).toISOString() : null };
      await createAnnouncement(token, payload);
      setAnnMsg('Announcement published successfully!');
      setNewAnn({ title: '', message: '', target_audience: 'all', priority: 'normal', expiry_date: '' });
      const updated = await getAdminAnnouncements(token);
      setAdminAnnouncements(updated);
      setTimeout(() => setAnnMsg(''), 3000);
    } catch (err) { alert(err.message); }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const { deleteAnnouncement, getAdminAnnouncements } = await import('./api');
      await deleteAnnouncement(token, id);
      const updated = await getAdminAnnouncements(token);
      setAdminAnnouncements(updated);
    } catch (err) { alert(err.message); }
  };

  const handleAddApartment = async (e) => {
    e.preventDefault();
    try {
      const { addApartment, getApartments } = await import('./api');
      await addApartment(token, aptName, aptCode.toUpperCase());
      setAdminMsg(`Apartment ${aptName} added successfully!`);
      setAptName(""); setAptCode("");
      const apps = await getApartments();
      setApartmentsList(apps);
    } catch (err) { alert(err.message); }
  };

  const handleDeleteApartment = (apt) => {
    setDeleteModal({ show: true, type: 'apt', id: apt.id, name: apt.name });
  };

  const handleDeleteBlock = (block) => {
    setDeleteModal({ show: true, type: 'block', id: block.id, name: `Block ${block.block_name}` });
  };

  const confirmDelete = async () => {
    if ((deleteModal.type === 'resident' || deleteModal.type === 'apt') && !termsAgreed) {
      alert("Please review and agree to the Terms & Conditions before proceeding.");
      return;
    }

    const { type, id } = deleteModal;
    setDeleteModal({ ...deleteModal, show: false });
    setTermsAgreed(false);

    try {
      const { deleteApartment, deleteBlock, getApartments, deleteCustomer, getAdminCustomers } = await import('./api');
      if (type === 'apt') {
        await deleteApartment(token, id);
        setAdminMsg("Apartment removed successfully.");
      } else if (type === 'block') {
        await deleteBlock(token, id);
      } else if (type === 'resident') {
        await deleteCustomer(token, id);
        getAdminCustomers(token).then(setAdminCustomers);
        alert("Resident removed safely.");
      } else if (type === 'worker') {
        const { deleteWorker, getAdminWorkers } = await import('./api');
        await deleteWorker(token, id);
        getAdminWorkers(token).then(setAdminWorkers);
        alert("Worker deregistered safely.");
      }

      if (type === 'apt' || type === 'block') {
        const fresh = await getApartments();
        setApartmentsList(fresh);
      }
      if (type === 'apt') setTimeout(() => setAdminMsg(""), 3000);
    } catch (err) { alert(err.message); }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      const { createAdminWorker, getAdminWorkers } = await import('./api');
      const res = await createAdminWorker(token, newWorker);
      setAdminMsg(res.message);
      setShowCreateWorker(false);
      setNewWorker({ name: '', email: '', mobile_number: '', password: '', gender: 'Male', skills: 'plumbing', location: 'Downtown' });
      const workers = await getAdminWorkers(token);
      setAdminWorkers(workers);
    } catch (err) { alert(err.message); }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    try {
      const { addBlock, getApartments } = await import('./api');
      await addBlock(token, blockAptId, blockName.toUpperCase());
      setAdminMsg(`Block ${blockName} added!`);
      setBlockName("");
      const apps = await getApartments();
      setApartmentsList(apps);
    } catch (err) { alert(err.message); }
  };

  const handleRunCelery = async () => {
    try {
      await triggerScheduler(token);
      setAdminMsg("Admin Force-Trigger Executed! All generic queues, complaint trackers, and reminder sweeps have been forcefully dumped onto the Redis pipeline.");
    } catch (e) {
      alert(e.message);
    }
  }

  const executeBulkDelete = async () => {
    try {
      const { deleteComplaint } = await import('./api');
      await Promise.all(selectedTickets.map(id => deleteComplaint(token, id)));
      setConfirmDeleteBox(false);
      setConfirmCheckbox(false);
      setSelectedTickets([]);
      reloadBookings();
      setAdminMsg("Data permanently deleted from internal stores.");
    } catch (e) {
      alert("Error during bulk delete: " + e.message);
    }
  };

  const handleAddSvc = async (e) => {
    e.preventDefault();
    try {
      const { addMaintenanceService, getAdminMaintenance } = await import('./api');
      await addMaintenanceService(token, selectedAptForPlan.plan.id, svcForm);
      const fresh = await getAdminMaintenance(token);
      setAdminMaintData(fresh);
      setSelectedAptForPlan(fresh.find(a => a.apartment_id === selectedAptForPlan.apartment_id));
      setShowSvcForm(false);
      setSvcForm({ service_name: '', sla_time: '', is_enabled: true });
    } catch (err) { alert(err.message); }
  };

  const handleUpdateSvc = async (e) => {
    e.preventDefault();
    try {
      const { updateMaintenanceService, getAdminMaintenance } = await import('./api');
      await updateMaintenanceService(token, selectedAptForPlan.plan.id, editingSvcId, svcForm);
      const fresh = await getAdminMaintenance(token);
      setAdminMaintData(fresh);
      setSelectedAptForPlan(fresh.find(a => a.apartment_id === selectedAptForPlan.apartment_id));
      setEditingSvcId(null);
      setSvcForm({ service_name: '', sla_time: '', is_enabled: true });
    } catch (err) { alert(err.message); }
  };

  const handleDeleteSvc = async (id) => {
    if (!window.confirm("Delete this service permanently?")) return;
    try {
      const { deleteMaintenanceService, getAdminMaintenance } = await import('./api');
      await deleteMaintenanceService(token, selectedAptForPlan.plan.id, id);
      const fresh = await getAdminMaintenance(token);
      setAdminMaintData(fresh);
      setSelectedAptForPlan(fresh.find(a => a.apartment_id === selectedAptForPlan.apartment_id));
    } catch (err) { alert(err.message); }
  };

  const toggleAttendance = async (workerId) => {
    const existing = attendanceRecords.find(a => a.worker_id === workerId);
    const newStatus = existing?.status === "present" ? "absent" : "present";
    try {
      await markAttendance(token, workerId, targetDate, newStatus);
      const b = await getAttendance(token, targetDate);
      setAttendanceRecords(b);
    } catch (e) { alert(e.message); }
  };

  const getWorkerStatus = (workerId) => {
    const rec = attendanceRecords.find(a => a.worker_id === workerId);
    return rec ? rec.status : "unmarked";
  };

  const isPastDate = targetDate !== new Date().toISOString().split('T')[0];

  // Safe Analytics Groupings
  const workersByRole = workers.reduce((acc, worker) => {
    const role = (worker.skills || 'Unassigned').toUpperCase();
    if (!acc[role]) acc[role] = [];
    acc[role].push(worker);
    return acc;
  }, {});

  // Global Attendance Accumulators Calculation
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalUnmarked = workers.length;

  attendanceRecords.forEach(a => {
    if (a.status === 'present') { totalPresent++; totalUnmarked--; }
    if (a.status === 'absent') { totalAbsent++; totalUnmarked--; }
  });

  const handleExportCSV = () => {
    const rows = [];
    rows.push(["FIXNEST GLOBAL ANALYTICS REPORT"]);
    rows.push(["TRACKING DATE:", targetDate]);
    rows.push([""]);
    rows.push(["GLOBAL WORKFORCE:", workers.length]);
    rows.push(["ON-GROUND (PRESENT):", totalPresent]);
    rows.push(["OFF-DUTY (ABSENT):", totalAbsent]);
    rows.push(["TRACKING OMITTED:", totalUnmarked]);
    rows.push([""]);

    Object.entries(workersByRole).forEach(([role, workerList]) => {
      let dp = 0; let da = 0;
      workerList.forEach(w => {
        const st = getWorkerStatus(w.id);
        if (st === 'present') dp++;
        if (st === 'absent') da++;
      });
      rows.push([`DEPARTMENT: ${role.toUpperCase()}`, "HEADCOUNT:", workerList.length, "PRESENT:", dp, "ABSENT:", da]);
      rows.push(["Worker UID", "Full Name", "Contact", "Gender", "Cluster", "Status"]);

      workerList.forEach(w => {
        const status = getWorkerStatus(w.id);
        rows.push([
          w.id,
          `"${w.name || 'Unsaved'}"`,
          `"${w.mobile_number || 'None'}"`,
          w.gender || 'Unknown',
          w.location || 'Floating',
          status.toUpperCase()
        ]);
      });
      rows.push([""]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fixnest_attendance_${targetDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Admin sidebar nav helper ──
  const adminNavItems = [
    { key: 'overview', label: 'Overview', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { key: 'apartments', label: 'Apartments', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /></svg> },
    { key: 'attendance', label: 'Attendance', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    { key: 'workers', label: 'Workers', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> },
    { key: 'customers', label: 'Customers', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    { key: 'announcements', label: 'Announcements', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg> },
    { key: 'apt-maintenance', label: 'Apt. Maintenance', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /></svg> },
    { key: 'rms', label: 'RMS Management', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.9A8.38 8.38 0 014 11.3a8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg> },
    { key: 'delivery-stats', label: 'Delivery Stats', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16h6M12 16h.01M20 21v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4M12 8l-4-4-4 4M8 12V4" /></svg> },
    { key: 'visitor-analytics', label: 'Visitor Analytics', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> },
    { key: 'extra_management', label: 'Extra Services', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> },
    { key: 'payments',         label: 'Revenue & Payments', svg: <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12l4 2-4 2v-4z"/><circle cx="18" cy="12" r="2"/></svg> },
  ];


  return (
    <div className="cd-layout">
      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '2rem', maxWidth: '450px', width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>⚠️</div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '1rem' }}>Confirm Deletion</h2>
            <p style={{ fontSize: '1rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{deleteModal.name}</strong>?
            </p>
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Security & Impact Guidelines</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#475569', lineHeight: '1.8' }}>
                <li>This action is **permanent** and cannot be reversed.</li>
                {deleteModal.type === 'resident' && (
                  <>
                    <li>All **Visitor Passes** for this resident will be invalidated.</li>
                    <li>Maintenance logs and communication records will be archived.</li>
                    <li>Resident credentials will be immediately revoked.</li>
                  </>
                )}
                {deleteModal.type === 'worker' && (
                  <>
                    <li>All **Attendance records** for this worker will be archived.</li>
                    <li>Worker will be removed from all **Pending Tasks**.</li>
                    <li>Worker portal access will be immediately terminated.</li>
                    <li>Historical performance data will be archived for compliance.</li>
                  </>
                )}
                {deleteModal.type === 'apt' && <li>All associated **Blocks** and **Resident profiles** will be affected.</li>}
                {deleteModal.type === 'block' && <li>Associated **Security data** for this block will be archived.</li>}
              </ul>
            </div>

            <div style={{
              padding: '1rem', background: termsAgreed ? '#ecfdf5' : '#fef2f2',
              borderRadius: '14px', border: `1.5px solid ${termsAgreed ? '#10b981' : '#fee2e2'}`,
              marginBottom: '2rem', transition: '0.3s'
            }}>
              <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={e => setTermsAgreed(e.target.checked)}
                  style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: 600, lineHeight: '1.4' }}>
                  I understand the operational impact and agree to the permanent removal terms.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setDeleteModal({ show: false }); setTermsAgreed(false); }} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 800, color: '#64748b', cursor: 'pointer', transition: '0.2s' }}>Cancel</button>
              <button
                disabled={!termsAgreed}
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '14px', border: 'none',
                  background: termsAgreed ? '#ef4444' : '#94a3b8',
                  fontWeight: 800, color: '#fff',
                  cursor: termsAgreed ? 'pointer' : 'not-allowed',
                  transition: '0.3s',
                  boxShadow: termsAgreed ? '0 8px 15px rgba(239, 68, 68, 0.2)' : 'none'
                }}
              >
                Confirm & Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-logo">
          <img src="/new_logo.png" alt="FixNest logo" className="cd-logo-img" />
          <span className="cd-logo-text">FixNest</span>
        </div>

        <div className="cd-profile-block">
          <img
            className="cd-profile-avatar"
            src="https://ui-avatars.com/api/?name=Admin&background=1e3a8a&color=fff&size=80"
            alt="admin avatar"
          />
          <div className="cd-profile-text">
            <span className="cd-profile-unit">Admin Panel</span>
            <span className="cd-profile-role">ADMINISTRATOR</span>
          </div>
        </div>

        <nav className="cd-nav">
          {adminNavItems.map(({ key, label, svg }) => (
            <a
              key={key}
              href={`#${key}`}
              onClick={e => { e.preventDefault(); setAdminView(key); }}
              className={`cd-nav-item${adminView === key ? ' cd-nav-active' : ''}`}
            >
              {svg}
              {label}
            </a>
          ))}
          <a
            href="#logout"
            onClick={e => { e.preventDefault(); logout(); }}
            className="cd-nav-item"
            style={{ color: '#ef4444', marginTop: 'auto' }}
          >
            <svg className="cd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Sign Out
          </a>
        </nav>

        <button className="cd-concierge-btn" onClick={handleRunCelery}>
          ⚡ Override Scheduler
        </button>
      </aside>

      {/* ── Admin Main ── */}
      <main className="cd-main">
        {/* Topbar */}
        <header className="cd-topbar">
          <div className="cd-topbar-icons">
            <button className="cd-icon-btn" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
            </button>
            <button className="cd-icon-btn" title="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
            </button>
            <div className="cd-avatar-btn" style={{ cursor: 'default' }}>
              <img src="https://ui-avatars.com/api/?name=Admin&background=1e3a8a&color=fff&size=80" alt="admin" />
            </div>
          </div>
        </header>

        {/* Page Header Banner — Overview only */}
        {adminView === 'overview' && (
          <section className="cd-banner" style={{ marginBottom: '1.75rem' }}>
            <div className="cd-banner-text">
              <h1>Master Command Center</h1>
              <p>Nest in Comfort — We fix the Rest.</p>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.5rem 1.25rem', color: '#fff', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '1px' }}>
              ADMIN
            </span>
          </section>
        )}

        {adminMsg && (
          <div className="cd-save-msg" style={{ marginBottom: '1.5rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            {adminMsg}
          </div>
        )}

        {/* ── VISITOR ANALYTICS ── */}
        {adminView === "visitor-analytics" && <VisitorAnalytics token={token} />}

        {/* ── APARTMENTS ── */}
        {adminView === "apartments" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* STATS OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div className="cd-stat-card" style={{ borderLeft: '4px solid #3b5bdb', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏢</div>
                <div>
                  <p className="cd-stat-label">Total Apartments</p>
                  <p className="cd-stat-value" style={{ marginBottom: 0 }}>{apartmentsList.length}</p>
                </div>
              </div>
              <div className="cd-stat-card" style={{ borderLeft: '4px solid #0ea5e9', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🧱</div>
                <div>
                  <p className="cd-stat-label">Total Blocks</p>
                  <p className="cd-stat-value" style={{ marginBottom: 0 }}>{apartmentsList.reduce((acc, a) => acc + (a.blocks?.length || 0), 0)}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

              {/* CREATE FORMS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="cd-profile-card" style={{ borderLeft: '4px solid #3b5bdb' }}>
                  <h3 className="cd-profile-info-title" style={{ color: '#1e3a8a' }}>Add New Apartment</h3>
                  <form onSubmit={handleAddApartment} className="cd-profile-form">
                    <div className="cd-profile-field"><label>Apartment Name</label><input type="text" value={aptName} onChange={e => setAptName(e.target.value)} required /></div>
                    <div className="cd-profile-field"><label>Apartment Code (2-Letter)</label><input type="text" maxLength="2" value={aptCode} onChange={e => setAptCode(e.target.value.toUpperCase())} required placeholder="e.g. MH" /></div>
                    <button type="submit" className="cd-save-btn" style={{ width: 'fit-content' }}>Create Apartment</button>
                  </form>
                </div>
                <div className="cd-profile-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
                  <h3 className="cd-profile-info-title" style={{ color: '#0ea5e9' }}>Add Block to Apartment</h3>
                  <form onSubmit={handleAddBlock} className="cd-profile-form">
                    <div className="cd-profile-field">
                      <label>Select Apartment</label>
                      <select value={blockAptId} onChange={e => setBlockAptId(e.target.value)} required>
                        <option value="">-- Choose Apartment --</option>
                        {apartmentsList.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                      </select>
                    </div>
                    <div className="cd-profile-field"><label>Block Name</label><input type="text" value={blockName} onChange={e => setBlockName(e.target.value.toUpperCase())} required placeholder="e.g. A" /></div>
                    <button type="submit" className="cd-save-btn" style={{ width: 'fit-content', background: '#0ea5e9' }}>Create Block</button>
                  </form>
                </div>
              </div>

              {/* LIST OF APARTMENTS */}
              <div className="cd-profile-card">
                <h3 className="cd-profile-info-title">Collaborated Complexes</h3>
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        <th style={{ padding: '1rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Apt Code</th>
                        <th style={{ padding: '1rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Complex Name</th>
                        <th style={{ padding: '1rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>Blocks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apartmentsList.length === 0 && (
                        <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No apartments collaborated yet.</td></tr>
                      )}
                      {apartmentsList.map(apt => (
                        <tr key={apt.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fbfcfe'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', background: '#eff6ff', color: '#3b5bdb', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem' }}>{apt.code}</span>
                          </td>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '1rem', marginBottom: '0.5rem' }}>{apt.name}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {apt.blocks?.map(b => (
                                <div key={b.id} className="block-pill" style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem',
                                  background: '#f1f5f9', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, color: '#475569',
                                  border: '1px solid #e2e8f0', transition: 'all 0.2s'
                                }}>
                                  {b.block_name}
                                  <button
                                    onClick={() => handleDeleteBlock(b)}
                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                                    onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                                    title={`Delete Block ${b.block_name}`}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  </button>
                                </div>
                              ))}
                              {(!apt.blocks || apt.blocks.length === 0) && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No blocks configured</span>}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteApartment(apt)}
                              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.5rem', transition: 'color 0.2s' }}
                              onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                              onMouseOut={e => e.currentTarget.style.color = '#cbd5e1'}
                              title="Delete Apartment"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {adminView === "overview" && (
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="cd-section-title" style={{ margin: 0 }}>Global Ticket Queue</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="selectAll"
                      checked={complaints.length > 0 && selectedTickets.length === complaints.length}
                      onChange={(e) => setSelectedTickets(e.target.checked ? complaints.map(c => c.id) : [])}
                      style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="selectAll" style={{ fontWeight: '500', color: '#3b5bdb', cursor: 'pointer' }}>Select All</label>
                  </div>
                  {selectedTickets.length > 0 && (
                    <button className="cd-cancel-btn" style={{ background: '#ef4444', color: '#fff', padding: '0.4rem 1rem' }} onClick={() => { setConfirmCheckbox(false); setConfirmDeleteBox(true); }}>
                      Delete Selected ({selectedTickets.length})
                    </button>
                  )}
                </div>
              </div>

              {confirmDeleteBox && (
                <div className="cd-profile-card" style={{ borderLeft: '4px solid #ef4444', background: '#fef2f2', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#ef4444', margin: '0 0 1rem' }}>⚠️ Critical Action: Delete Records</h3>
                  <p style={{ margin: '0 0 1rem', color: '#7f1d1d' }}>You are about to irreversibly wipe {selectedTickets.length} ticket(s) from the database.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <input type="checkbox" id="agree-delete" style={{ margin: 0, width: '18px', height: '18px' }} checked={confirmCheckbox} onChange={e => setConfirmCheckbox(e.target.checked)} />
                    <label htmlFor="agree-delete" style={{ color: '#991b1b', fontWeight: 'bold', cursor: 'pointer' }}>I agree this action is permanent and cannot be undone.</label>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="cd-save-btn" disabled={!confirmCheckbox} style={{ background: confirmCheckbox ? '#dc2626' : '#fca5a5', opacity: confirmCheckbox ? 1 : 0.6 }} onClick={executeBulkDelete}>Confirm Delete</button>
                    <button className="cd-cancel-btn" onClick={() => setConfirmDeleteBox(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {complaints.length === 0 && <p style={{ color: '#94a3b8' }}>No tickets in database.</p>}
                {complaints.map(b => (
                  <div key={b.id} className="cd-profile-card" style={{ borderLeft: `4px solid ${b.worker_id ? '#22c55e' : '#94a3b8'}`, background: selectedTickets.includes(b.id) ? '#fef2f2' : '#fff', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          checked={selectedTickets.includes(b.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTickets([...selectedTickets, b.id]);
                            else setSelectedTickets(selectedTickets.filter(id => id !== b.id));
                          }}
                        />
                        <strong style={{ color: '#0f172a' }}>COMPLAINT #{b.id}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`status-badge status-${b.status}`}>{b.status}</span>
                        <button className="cd-cancel-btn" style={{ background: '#fee2e2', color: '#ef4444', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setSelectedTickets([b.id]); setConfirmCheckbox(false); setConfirmDeleteBox(true); }}>Trash</button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem', marginLeft: '2rem' }}>Customer UID: {b.customer_id} | Worker: {b.worker_id || 'Unassigned'}</p>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0 2rem' }}>Type: {b.complaint_type.toUpperCase()} | Priority: {b.priority}</p>
                    {b.description && <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0.4rem 0 0 2rem' }}><em>"{b.description}"</em></p>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h2 className="cd-section-title">Worker Analytics</h2>
              {Object.entries(workersByRole).map(([role, workerList]) => (
                <div key={role} className="cd-profile-card" style={{ marginBottom: '1rem', borderLeft: '4px solid #3b5bdb' }}>
                  <h4 style={{ margin: '0 0 1rem', color: '#1e3a8a', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.5rem' }}>{role} ({workerList.length})</h4>
                  {workerList.map(w => (
                    <div key={w.id} style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{w.name || 'Unnamed Worker'}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{w.mobile_number || 'No Data'} | {w.gender || 'N/A'}</div>
                      </div>
                      <span style={{ fontSize: '0.78rem', background: getWorkerStatus(w.id) === 'present' ? '#dcfce7' : '#f1f5f9', color: getWorkerStatus(w.id) === 'present' ? '#166534' : '#475569', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 600 }}>
                        {getWorkerStatus(w.id) === 'present' ? 'Online' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {adminView === "attendance" && (
          <div>
            <div className="cd-profile-card" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #3b5bdb' }}>
              <div>
                <h3 className="cd-profile-info-title" style={{ margin: 0 }}>Daily Roster Tracking</h3>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.88rem' }}>Mark attendance for workers. Unmarked entries pause tracking workflows.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="cd-save-btn" style={{ background: '#10b981' }} onClick={handleExportCSV}>📥 Download Summary</button>
                <div className="cd-profile-field" style={{ margin: 0 }}>
                  <input type="date" style={{ padding: '0.6rem 0.9rem', border: '1.5px solid #3b5bdb', borderRadius: '10px', fontSize: '0.9rem', color: '#1e293b', background: '#f8fafc', outline: 'none' }}
                    value={targetDate} max={new Date().toISOString().split('T')[0]} onChange={e => setTargetDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="cd-stat-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '2rem' }}>
              {[
                { label: 'Global Workforce', value: `${workers.length} Profiles`, color: '#6366f1' },
                { label: 'On-Ground (Present)', value: `${totalPresent} Logged`, color: '#22c55e' },
                { label: 'Off-Duty (Absent)', value: `${totalAbsent} Logged`, color: '#ef4444' },
                { label: 'Tracking Omitted', value: `${totalUnmarked} Warnings`, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="cd-stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
                  <p className="cd-stat-label">{s.label}</p>
                  <p className="cd-stat-value" style={{ fontSize: '1.4rem' }}>{s.value}</p>
                </div>
              ))}
            </div>

            {Object.entries(workersByRole).map(([role, workerList]) => {
              let deptPresent = 0; let deptAbsent = 0;
              workerList.forEach(w => {
                const st = getWorkerStatus(w.id);
                if (st === 'present') deptPresent++;
                if (st === 'absent') deptAbsent++;
              });
              return (
                <div key={role} className="cd-profile-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b5bdb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f0f2f8', paddingBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1rem', fontWeight: 700 }}>
                      DEPARTMENT: {role}
                      <span style={{ marginLeft: '0.75rem', fontSize: '0.78rem', background: '#eff2ff', color: '#3b5bdb', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>{workerList.length} Headcount</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
                        <span style={{ color: '#475569' }}>{deptPresent} Present</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }}></span>
                        <span style={{ color: '#475569' }}>{deptAbsent} Absent</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {workerList.map(w => {
                      const status = getWorkerStatus(w.id);
                      return (
                        <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem 1rem', borderRadius: '10px' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{w.name || `Worker #${w.user_id}`}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>ID: {w.id} | {w.location || 'Floating'} | {w.gender || 'N/A'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <span style={{ fontSize: '0.78rem', minWidth: '70px', textAlign: 'right', background: status === 'present' ? '#dcfce7' : status === 'absent' ? '#fee2e2' : '#f1f5f9', color: status === 'present' ? '#166534' : status === 'absent' ? '#991b1b' : '#64748b', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 700 }}>{status.toUpperCase()}</span>
                            {!isPastDate ? (
                              <div
                                className={`ft-toggle ${status}`}
                                onClick={() => toggleAttendance(w.id)}
                                title={`Currently ${status === 'unmarked' ? 'Unmarked' : status.toUpperCase()}`}
                              >
                                <div className="ft-slider" />
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem' }}>Historical lock</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── WORKERS ── */}
        {adminView === "workers" && (
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
              <button onClick={() => setWorkerSubView('list')} style={{ padding: '0.75rem 0.5rem', border: 'none', background: 'none', borderBottom: workerSubView === 'list' ? '2.5px solid #3b5bdb' : '2.5px solid transparent', color: workerSubView === 'list' ? '#3b5bdb' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem' }}>Workers Registry</button>
              <button onClick={() => setWorkerSubView('depts')} style={{ padding: '0.75rem 0.5rem', border: 'none', background: 'none', borderBottom: workerSubView === 'depts' ? '2.5px solid #3b5bdb' : '2.5px solid transparent', color: workerSubView === 'depts' ? '#3b5bdb' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem' }}>Departments Manager</button>
              <button onClick={() => setWorkerSubView('clusters')} style={{ padding: '0.75rem 0.5rem', border: 'none', background: 'none', borderBottom: workerSubView === 'clusters' ? '2.5px solid #3b5bdb' : '2.5px solid transparent', color: workerSubView === 'clusters' ? '#3b5bdb' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem' }}>Clusters Manager</button>
            </div>

            {workerSubView === 'list' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 className="cd-section-title" style={{ margin: 0 }}>Worker Management</h2>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="cd-save-btn" onClick={() => setShowCreateWorker(!showCreateWorker)}>➕ Create Worker</button>
                    <button className="cd-save-btn" style={{ background: '#0ea5e9' }} onClick={() => import('./api').then(({ downloadWorkersExcel }) => downloadWorkersExcel(token).catch(e => alert(e.message)))}>📥 Download Data</button>
                  </div>
                </div>

                {showCreateWorker && (
                  <div className="cd-profile-card" style={{ marginBottom: '1.75rem', borderLeft: '4px solid #3b82f6' }}>
                    <h3 className="cd-profile-info-title" style={{ color: '#3b82f6' }}>Create New Worker Profile</h3>
                    <form onSubmit={handleCreateWorker} className="cd-profile-form">
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[['Full Name', 'text', 'name'], ['Email', 'email', 'email'], ['Mobile', 'text', 'mobile_number'], ['Password', 'password', 'password']].map(([label, type, field]) => (
                          <div key={field} className="cd-profile-field" style={{ flex: '1 1 200px' }}>
                            <label>{label}</label>
                            <input type={type} required value={newWorker[field]} onChange={e => setNewWorker({ ...newWorker, [field]: e.target.value })} />
                          </div>
                        ))}
                        <div className="cd-profile-field" style={{ flex: '1 1 150px' }}>
                          <label>Gender</label>
                          <select value={newWorker.gender} onChange={e => setNewWorker({ ...newWorker, gender: e.target.value })}><option>Male</option><option>Female</option></select>
                        </div>
                        <div className="cd-profile-field" style={{ flex: '1 1 150px' }}>
                          <label>Department</label>
                          <select value={newWorker.skills} onChange={e => setNewWorker({ ...newWorker, skills: e.target.value })} required>
                            <option value="">-- Choose Dept --</option>
                            {availableDepts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="cd-profile-field" style={{ flex: '1 1 150px' }}>
                          <label>Cluster</label>
                          <select value={newWorker.location} onChange={e => setNewWorker({ ...newWorker, location: e.target.value })} required>
                            <option value="">-- Choose Cluster --</option>
                            {availableClusters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="cd-profile-form-actions">
                        <button type="submit" className="cd-save-btn">Submit & Create</button>
                        <button type="button" className="cd-cancel-btn" onClick={() => setShowCreateWorker(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {(() => {
                  const groups = adminWorkers.reduce((acc, w) => {
                    const d = (w.department || 'UNASSIGNED').toUpperCase();
                    if (!acc[d]) acc[d] = [];
                    acc[d].push(w);
                    return acc;
                  }, {});
                  return Object.entries(groups).map(([dept, wList]) => (
                    <div key={dept} className="cd-profile-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #0ea5e9', overflowX: 'auto' }}>
                      <h3 style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 700 }}>
                        {dept} WORKERS
                        <span style={{ fontSize: '0.78rem', background: '#e0f2fe', color: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>{wList.length} Headcount</span>
                      </h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            {['ID', 'Name', 'Username', 'Contact', 'Action'].map(h => <th key={h} style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {wList.map(w => (
                            <tr key={w.worker_id} style={{ borderBottom: '1px solid #f0f2f8' }}>
                              <td style={{ padding: '0.75rem', fontWeight: 700, color: '#3b5bdb' }}>#{w.worker_id}</td>
                              <td style={{ padding: '0.75rem' }}>{w.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unsaved</span>}</td>
                              <td style={{ padding: '0.75rem', color: '#1e293b', fontSize: '0.88rem' }}>{w.username}</td>
                              <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.88rem' }}>{w.contact_info || 'None'}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button className="cd-cancel-btn" style={{ background: '#fee2e2', color: '#ef4444', padding: '0.3rem 0.75rem', fontSize: '0.8rem', border: '1px solid #fecaca' }} onClick={() => {
                                    if (window.confirm(`Reset password to 'worker123' for ${w.username}?`)) {
                                      import('./api').then(({ resetWorkerPassword }) => resetWorkerPassword(token, w.worker_id).then(r => alert(r.message)).catch(e => alert(e.message)));
                                    }
                                  }}>Reset Auth</button>
                                  <button onClick={() => {
                                    setDeleteModal({ show: true, type: 'worker', id: w.worker_id, name: w.name || w.username });
                                    setTermsAgreed(false);
                                  }} style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ));
                })()}
              </>
            )}

            {workerSubView === 'depts' && (
              <div className="cd-profile-card" style={{ borderLeft: '4px solid #3b5bdb' }}>
                <h3 className="cd-profile-info-title" style={{ color: '#3b5bdb' }}>Global Department Management</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Add or remove organizational departments. These will appear as options in worker registration.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. Plumbing, Security, IT..."
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    style={{ flex: 1, padding: '0.9rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem' }}
                  />
                  <button onClick={async () => {
                    if (!newDeptName) return;
                    const { addDepartment, getDepartments } = await import('./api');
                    await addDepartment(token, newDeptName);
                    setNewDeptName("");
                    getDepartments().then(setAvailableDepts);
                  }} className="cd-save-btn" style={{ padding: '0 2rem', height: '50px' }}>Add Dept</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {availableDepts.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📑</div>
                      <h4 style={{ margin: 0, color: '#1e3a8a' }}>No Departments Registry</h4>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Use the field above to add your first department.</p>
                    </div>
                  ) : (
                    availableDepts.map(d => (
                      <div key={d.id} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '18px', border: '1.2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#3b5bdb'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div style={{ width: '8px', height: '8px', background: '#3b5bdb', borderRadius: '50%' }}></div>
                          <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '1rem' }}>{d.name}</span>
                        </div>
                        <button onClick={async () => {
                          if (!window.confirm(`Delete ${d.name} department?`)) return;
                          const { deleteDepartment, getDepartments } = await import('./api');
                          await deleteDepartment(token, d.id);
                          getDepartments().then(setAvailableDepts);
                        }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: '0.2s' }} title="Delete">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {workerSubView === 'clusters' && (
              <div className="cd-profile-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <h3 className="cd-profile-info-title" style={{ color: '#f59e0b' }}>Global Cluster Management</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Define geographic or logical clusters (e.g. Northside, Sector 7). These categorize your worker locations.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. Downtown, West End, Phase 1..."
                    value={newClusterName}
                    onChange={e => setNewClusterName(e.target.value)}
                    style={{ flex: 1, padding: '0.9rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem' }}
                  />
                  <button onClick={async () => {
                    if (!newClusterName) return;
                    const { addCluster, getClusters } = await import('./api');
                    await addCluster(token, newClusterName);
                    setNewClusterName("");
                    getClusters().then(setAvailableClusters);
                  }} className="cd-save-btn" style={{ padding: '0 2rem', height: '50px', background: '#f59e0b' }}>Add Cluster</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {availableClusters.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#fffbeb', borderRadius: '20px', border: '2px dashed #fcd34d', color: '#92400e' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📍</div>
                      <h4 style={{ margin: 0, color: '#b45309' }}>No Clusters Defined</h4>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Start by adding locations where your workers are operating.</p>
                    </div>
                  ) : (
                    availableClusters.map(c => (
                      <div key={c.id} style={{ padding: '1.25rem', background: '#fffcf0', borderRadius: '18px', border: '1.2px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.currentTarget.style.borderColor = '#fde68a'; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></div>
                          <span style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>{c.name}</span>
                        </div>
                        <button onClick={async () => {
                          if (!window.confirm(`Delete ${c.name} cluster?`)) return;
                          const { deleteCluster, getClusters } = await import('./api');
                          await deleteCluster(token, c.id);
                          getClusters().then(setAvailableClusters);
                        }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: '0.2s' }} title="Delete">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {adminView === "customers" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 className="cd-section-title" style={{ margin: 0 }}>Customer Management</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.4rem' }}>Oversee your resident ecosystem and manage access.</p>
              </div>
              <button className="cd-save-btn" style={{ background: '#f59e0b', borderRadius: '14px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)' }} onClick={() => import('./api').then(({ downloadCustomersExcel }) => downloadCustomersExcel(token).catch(e => alert(e.message)))}>📥 Download Master Registry</button>
            </div>

            {/* Global Filters */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Search Dynamics</label>
                <input
                  placeholder="Filter by Name, Email or Phone Number..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '14px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '1rem', transition: '0.3s' }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#f1f5f9'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Location Filter</label>
                <select
                  value={customerFilterLocation}
                  onChange={e => setCustomerFilterLocation(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '14px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '1rem', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="">All Regions</option>
                  {[...new Set(adminCustomers.map(c => (c.location || 'Unknown').toUpperCase()))].map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              // Filter logic
              const filtered = adminCustomers.filter(c => {
                const matchesSearch = !customerSearch ||
                  (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
                  c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  (c.phone && c.phone.includes(customerSearch));
                const matchesLocation = !customerFilterLocation || (c.location || 'Unknown').toUpperCase() === customerFilterLocation;
                return matchesSearch && matchesLocation;
              });

              if (filtered.length === 0) return (
                <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🕵️‍♂️</div>
                  <h3 style={{ color: '#1e293b', margin: 0 }}>No Customers Found</h3>
                  <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Adjust your search parameters to find residents.</p>
                </div>
              );

              const groups = filtered.reduce((acc, c) => {
                const l = (c.location || 'Unknown').toUpperCase();
                if (!acc[l]) acc[l] = [];
                acc[l].push(c);
                return acc;
              }, {});

              return Object.entries(groups).map(([loc, cList]) => (
                <div key={loc} className="cd-profile-card" style={{ marginBottom: '2rem', borderLeft: '6px solid #f59e0b', padding: '2.5rem', background: '#fff', borderRadius: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 800 }}>
                    <span style={{ background: '#fef3c7', padding: '8px', borderRadius: '12px' }}>🏢</span>
                    {loc} REGION
                    <span style={{ fontSize: '0.8rem', background: '#fff', color: '#b45309', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid #fef3c7', marginLeft: 'auto' }}>{cList.length} Active Residents</span>
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          {['Resident ID', 'Identity', 'Communication', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {cList.map(c => (
                          <tr key={c.customer_id} style={{ borderBottom: '1px solid #f0f2f8', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fcfdfd'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '1.25rem', fontWeight: 800, color: '#d97706' }}>FIX-{c.customer_id.toString().padStart(4, '0')}</td>
                            <td style={{ padding: '1.25rem' }}>
                              <div style={{ fontWeight: 800, color: '#1e293b' }}>{c.name || "FixNest Resident"}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email}</div>
                            </td>
                            <td style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>📱 {c.phone || 'NOT LINKED'}</td>
                            <td style={{ padding: '1.25rem' }}><span style={{ background: '#dcfce7', color: '#166534', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, border: '1px solid #bbf7d0' }}>VERIFIED</span></td>
                            <td style={{ padding: '1.25rem' }}>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => {
                                  if (window.confirm(`Reset password for ${c.email}?`)) {
                                    import('./api').then(({ resetCustomerPassword }) => resetCustomerPassword(token, c.customer_id).then(r => alert(r.message)).catch(e => alert(e.message)));
                                  }
                                }} style={{ background: '#fffcf0', border: '1.5px solid #fde68a', color: '#b45309', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Reset Auth</button>

                                <button onClick={() => {
                                  setDeleteModal({ show: true, type: 'resident', id: c.customer_id, name: c.email });
                                  setTermsAgreed(false);
                                }} style={{ background: '#fff1f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }} title="Remove Resident">Remove</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* ── APT-MAINTENANCE ── */}
        {adminView === 'apt-maintenance' && (
          <div>
            <h2 className="cd-section-title" style={{ marginBottom: '1.5rem' }}>🏠 Apartment Maintenance Plans</h2>

            {/* ── NEW: MONTHLY COLLECTION MANAGEMENT ── */}
            <div style={{
              marginBottom: '2.5rem', padding: '2.5rem', borderRadius: '32px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#fff', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
              <div style={{ position: 'absolute', right: '-50px', bottom: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)', filter: 'blur(60px)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    🏆 Collection Protocol
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '2rem' }}>
                    SMART BILLING CYCLE: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </p>

                  <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Monthly Revenue Goal</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>
                        ₹{adminMaintData.reduce((sum, apt) => sum + (apt.total_residents * (apt.plan?.maintenance_charge || 0)), 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ flex: 1, maxWidth: '250px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>COLLECTION STATUS</span>
                        <span style={{ color: '#10b981' }}>
                          ₹0 / ₹{adminMaintData.reduce((sum, apt) => sum + (apt.total_residents * (apt.plan?.maintenance_charge || 0)), 0).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ height: '10px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                        {/* Initially 0% for demonstration or dynamic if we have real payment tracking */}
                        <div style={{ height: '100%', width: `1%`, background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '10px' }} />
                      </div>
                      <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem', textAlign: 'right', fontWeight: 700 }}>
                        0% REVENUE COLLECTED
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.8rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '280px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '1rem' }}>SET PAYMENT DEADLINE</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      style={{
                        background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)',
                        padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', flex: 1
                      }}
                    />
                    <button
                      onClick={() => alert("Deadline updated for all residents.")}
                      style={{
                        background: '#fff', color: '#1e293b', border: 'none', padding: '0.9rem', borderRadius: '14px',
                        fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                      }}
                    >SAVE</button>
                  </div>
                  <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>
                    <div style={{ width: '6px', height: '6px', background: '#fbbf24', borderRadius: '50%' }} />
                    Automatic reminders active
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: selectedAptForPlan ? '1fr 1.3fr' : '1fr', gap: '1.5rem' }}>

              {/* Left: apartment list */}
              <div>
                <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1rem' }}>Click an apartment to create or edit its maintenance plan.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {adminMaintData.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No apartments found.</p>}
                  {adminMaintData.map(apt => (
                    <div
                      key={apt.apartment_id}
                      onClick={() => {
                        setSelectedAptForPlan(apt);
                        setPlanForm({ plan_name: apt.plan?.plan_name || 'Basic', maintenance_charge: apt.plan?.maintenance_charge || 0 });
                        setPlanMsg('');
                      }}
                      style={{ cursor: 'pointer', padding: '1rem 1.25rem', borderRadius: '14px', border: `2px solid ${selectedAptForPlan?.apartment_id === apt.apartment_id ? '#3b5bdb' : '#e0e7ef'}`, background: selectedAptForPlan?.apartment_id === apt.apartment_id ? '#eff2ff' : '#fff', transition: 'all 0.2s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>🏢 {apt.apartment_name}</strong>
                          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>👥 {apt.total_residents} resident{apt.total_residents !== 1 ? 's' : ''}</p>
                        </div>
                        {apt.plan
                          ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>{apt.plan.plan_name} · ₹{apt.plan.maintenance_charge}/mo</span>
                          : <span style={{ background: '#fee2e2', color: '#ef4444', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>No Plan</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: plan editor */}
              {selectedAptForPlan && (
                <div className="cd-profile-card" style={{ borderLeft: '4px solid #3b5bdb' }}>
                  <h3 className="cd-profile-info-title">
                    {selectedAptForPlan.plan ? 'Update' : 'Create'} Plan — {selectedAptForPlan.apartment_name}
                  </h3>
                  {planMsg && <div className="cd-save-msg" style={{ marginBottom: '1rem' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>{planMsg}</div>}

                  <form className="cd-profile-form" onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const { createMaintenancePlan, updateMaintenancePlan, getAdminMaintenance } = await import('./api');
                      if (selectedAptForPlan.plan) {
                        await updateMaintenancePlan(token, selectedAptForPlan.plan.id, planForm);
                      } else {
                        await createMaintenancePlan(token, { ...planForm, apartment_id: selectedAptForPlan.apartment_id });
                      }
                      const fresh = await getAdminMaintenance(token);
                      setAdminMaintData(fresh);
                      const updated = fresh.find(a => a.apartment_id === selectedAptForPlan.apartment_id);
                      setSelectedAptForPlan(updated);
                      setPlanMsg('Plan saved successfully!');
                      setTimeout(() => setPlanMsg(''), 3000);
                    } catch (err) { alert(err.message); }
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div className="cd-profile-field" style={{ flex: '1 1 140px' }}>
                        <label>Plan Name</label>
                        <select value={planForm.plan_name} onChange={e => setPlanForm(f => ({ ...f, plan_name: e.target.value }))}>
                          <option value="Basic">Basic</option>
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                        </select>
                      </div>
                      <div className="cd-profile-field" style={{ flex: '1 1 140px' }}>
                        <label>Monthly Charge (₹)</label>
                        <input type="number" min="0" value={planForm.maintenance_charge} onChange={e => setPlanForm(f => ({ ...f, maintenance_charge: Number(e.target.value) }))} />
                      </div>
                    </div>
                    <div className="cd-profile-form-actions">
                      <button type="submit" className="cd-save-btn">💾 {selectedAptForPlan.plan ? 'Update' : 'Create'} Plan</button>
                    </div>
                  </form>

                  {/* Service management */}
                  {selectedAptForPlan.plan && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ color: '#1e3a8a', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Service Controls</h4>
                        {!showSvcForm && !editingSvcId && (
                          <button
                            className="cd-save-btn"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#0ea5e9' }}
                            onClick={() => {
                              setShowSvcForm(true);
                              setSvcForm({ service_name: '', sla_time: '', is_enabled: true });
                            }}
                          >
                            ➕ Add Service
                          </button>
                        )}
                      </div>

                      {(showSvcForm || editingSvcId) && (
                        <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                          <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#475569' }}>{editingSvcId ? 'Edit Service' : 'Add New Service'}</h5>
                          <form onSubmit={editingSvcId ? handleUpdateSvc : handleAddSvc} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Plumbing"
                                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                  value={svcForm.service_name}
                                  onChange={e => setSvcForm({ ...svcForm, service_name: e.target.value })}
                                  required
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>SLA (e.g. 4 hours)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Next Day"
                                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                  value={svcForm.sla_time}
                                  onChange={e => setSvcForm({ ...svcForm, sla_time: e.target.value })}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={svcForm.is_enabled} onChange={e => setSvcForm({ ...svcForm, is_enabled: e.target.checked })} /> enabled
                              </label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="cd-cancel-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setShowSvcForm(false); setEditingSvcId(null); }}>Cancel</button>
                                <button type="submit" className="cd-save-btn" style={{ padding: '0.3rem 1rem', fontSize: '0.75rem' }}>{editingSvcId ? 'Save' : 'Add'}</button>
                              </div>
                            </div>
                          </form>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {selectedAptForPlan.plan.services.length === 0 && (
                          <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No services custom defined for this plan.</p>
                        )}
                        {selectedAptForPlan.plan.services.map(svc => (
                          <div key={svc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '10px', background: svc.is_enabled ? '#f8fafc' : '#fef2f2', border: `1px solid ${svc.is_enabled ? '#e0e7ef' : '#fee2e2'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ fontSize: '1.1rem' }}>{SERVICE_ICONS[svc.service_name.toLowerCase()] || '⚙️'}</div>
                              <div>
                                <strong style={{ fontSize: '0.88rem', color: svc.is_enabled ? '#0f172a' : '#991b1b' }}>{svc.service_name}</strong>
                                {svc.sla_time && <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>⏱ {svc.sla_time}</p>}
                                {!svc.is_enabled && <p style={{ margin: 0, fontSize: '0.65rem', color: '#dc2626', fontWeight: 600 }}>DISABLED</p>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="cd-action-btn"
                                style={{ background: '#eff2ff', color: '#3b5bdb', padding: '4px' }}
                                title="Edit Service"
                                onClick={() => {
                                  setEditingSvcId(svc.id);
                                  setSvcForm({ service_name: svc.service_name, sla_time: svc.sla_time || '', is_enabled: svc.is_enabled });
                                  setShowSvcForm(false);
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <button
                                className="cd-action-btn"
                                style={{ background: '#fff1f2', color: '#e11d48', padding: '4px' }}
                                title="Delete Service"
                                onClick={() => handleDeleteSvc(svc.id)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {adminView === 'announcements' && (
          <div>
            <h2 className="cd-section-title" style={{ marginBottom: '1.5rem' }}>Announcement Management</h2>

            {/* Create form */}
            <div className="cd-profile-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #3b5bdb' }}>
              <h3 className="cd-profile-info-title">Publish New Announcement</h3>
              {annMsg && (
                <div className="cd-save-msg" style={{ marginBottom: '1rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  {annMsg}
                </div>
              )}
              <form onSubmit={handleCreateAnnouncement} className="cd-profile-form">
                <div className="cd-profile-field">
                  <label>Title</label>
                  <input required value={newAnn.title} onChange={e => setNewAnn({ ...newAnn, title: e.target.value })} placeholder="e.g. Pool hours update" />
                </div>
                <div className="cd-profile-field">
                  <label>Message</label>
                  <textarea required rows={3} value={newAnn.message} onChange={e => setNewAnn({ ...newAnn, message: e.target.value })} placeholder="Full announcement text..." style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem', padding: '0.6rem 0.9rem', border: '1.5px solid #e0e7ef', borderRadius: '10px', outline: 'none', width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="cd-profile-field" style={{ flex: '1 1 150px' }}>
                    <label>Target Audience</label>
                    <select value={newAnn.target_audience} onChange={e => setNewAnn({ ...newAnn, target_audience: e.target.value })}>
                      <option value="all">All (Everyone)</option>
                      <option value="customer">Customers Only</option>
                      <option value="worker">Workers Only</option>
                    </select>
                  </div>
                  <div className="cd-profile-field" style={{ flex: '1 1 150px' }}>
                    <label>Priority</label>
                    <select value={newAnn.priority} onChange={e => setNewAnn({ ...newAnn, priority: e.target.value })}>
                      <option value="normal">Normal</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  <div className="cd-profile-field" style={{ flex: '1 1 180px' }}>
                    <label>Expiry Date (optional)</label>
                    <input type="date" value={newAnn.expiry_date} onChange={e => setNewAnn({ ...newAnn, expiry_date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="cd-profile-form-actions">
                  <button type="submit" className="cd-save-btn">📢 Publish Announcement</button>
                </div>
              </form>
            </div>

            {/* Existing announcements list */}
            <h3 style={{ color: '#1e3a8a', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Published Announcements ({adminAnnouncements.length})</h3>
            {adminAnnouncements.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No announcements published yet.</p>
            )}
            {adminAnnouncements.map(a => (
              <div key={a.id} className="cd-profile-card" style={{ marginBottom: '0.9rem', borderLeft: `4px solid ${a.priority === 'urgent' ? '#ef4444' : '#3b5bdb'}`, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    {a.priority === 'urgent' && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px', padding: '0.1rem 0.5rem' }}>URGENT</span>}
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{a.title}</strong>
                    <span style={{ fontSize: '0.78rem', background: a.target_audience === 'customer' ? '#eff2ff' : a.target_audience === 'worker' ? '#f0fdf4' : '#f8fafc', color: a.target_audience === 'customer' ? '#3b5bdb' : a.target_audience === 'worker' ? '#16a34a' : '#64748b', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                      {a.target_audience === 'all' ? '👥 Everyone' : a.target_audience === 'customer' ? '🏠 Customers' : '🔧 Workers'}
                    </span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 0.4rem' }}>{a.message}</p>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '1.25rem' }}>
                    <span>📅 {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {a.expiry_date && <span>⏳ Expires {new Date(a.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    <span>{timeAgo(a.created_at)}</span>
                  </div>
                </div>
                <button className="cd-cancel-btn" style={{ background: '#fee2e2', color: '#ef4444', padding: '0.35rem 0.8rem', fontSize: '0.8rem', flexShrink: 0 }} onClick={() => { if (window.confirm('Delete this announcement?')) handleDeleteAnnouncement(a.id); }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── RMS MANAGEMENT ── */}
        {adminView === 'rms' && (
          <div className="rms-container">
            {/* ── RMS HEADER & APT SELECTOR ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1.5px solid #edf2f7', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="cd-section-title" style={{ margin: '0 0 0.5rem' }}>RMS (Request Management System)</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#eff6ff', color: '#3b5bdb', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /></svg>
                    {selectedAptForRMS ? selectedAptForRMS.name : 'Global Management'}
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select an apartment complex to configure its service offerings</span>
                </div>
              </div>
              <div style={{ minWidth: '280px' }}>
                <select
                  className="cd-profile-input"
                  style={{ width: '100%', borderRadius: '12px', border: '1.5px solid #3b5bdb', color: '#1e3a8a', fontWeight: 700, padding: '0.75rem' }}
                  onChange={(e) => {
                    const apt = apartmentsList.find(a => a.id === parseInt(e.target.value));
                    setSelectedAptForRMS(apt || null);
                  }}
                  value={selectedAptForRMS?.id || ''}
                >
                  <option value="">Select Apartment Complex...</option>
                  {apartmentsList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            {!selectedAptForRMS ? (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f8fafc', borderRadius: '24px', color: '#94a3b8', border: '2px dashed #e2e8f0' }}>
                <div style={{ width: '80px', height: '80px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                  <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="1.5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>
                </div>
                <h3 style={{ color: '#1e3a8a', marginBottom: '0.5rem' }}>Select an Apartment First</h3>
                <p style={{ maxWidth: '400px', margin: '0 auto' }}>Choose a residential complex from the dropdown above to manage its specific maintenance categories and triage logic.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>

                {/* CATEGORIES & SERVICE CONFIGURATION */}
                <div className="cd-profile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 className="cd-profile-info-title" style={{ margin: 0 }}>Service Catalog for {selectedAptForRMS.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Enable/Disable categories and manage their sub-units</p>
                    </div>
                    <button className="cd-save-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => { setEditingCatId(null); setCatForm({ name: '' }); }}>➕ New Category</button>
                  </div>

                  {/* Add Category Form (In-Line) */}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e0e7ef', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', margin: '0 0 0.75rem', color: '#475569' }}>{editingCatId ? 'Edit Global Category' : 'Create New & Auto-Enable for ' + selectedAptForRMS.name}</h4>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const { createRMSCategory, patchRMSCategory, getAdminRMSCategories, updateApartmentRMSMapping, getApartmentRMSMappings } = await import('./api');
                      if (editingCatId) {
                        await patchRMSCategory(token, editingCatId, catForm.name);
                      } else {
                        const newCat = await createRMSCategory(token, catForm.name);
                        // Auto-enable for selected apt
                        await updateApartmentRMSMapping(token, selectedAptForRMS.id, newCat.id, true);
                        getApartmentRMSMappings(token, selectedAptForRMS.id).then(m => setRmsAptMappings(prev => ({ ...prev, [selectedAptForRMS.id]: m })));
                      }
                      setCatForm({ name: '' }); setEditingCatId(null);
                      getAdminRMSCategories(token).then(setRmsCats);
                    }} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        className="cd-profile-input"
                        style={{ flex: 1, padding: '0.6rem', background: '#fff' }}
                        placeholder="e.g. Electrical Maintenance"
                        value={catForm.name}
                        onChange={e => setCatForm({ name: e.target.value })}
                        required
                      />
                      <button type="submit" className="cd-save-btn" style={{ padding: '0 1.25rem', whiteSpace: 'nowrap' }}>{editingCatId ? 'Update' : 'Create'}</button>
                      {editingCatId && <button type="button" className="cd-cancel-btn" onClick={() => { setEditingCatId(null); setCatForm({ name: '' }); }}>Cancel</button>}
                    </form>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {rmsCats.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No categories in the system. Add one above!</p>}
                    {rmsCats.map(cat => (
                      <div key={cat.id} style={{ border: '1.5px solid #edf2f7', borderRadius: '16px', padding: '1.25rem', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ width: '42px', height: '42px', background: (rmsAptMappings[selectedAptForRMS.id] && rmsAptMappings[selectedAptForRMS.id][cat.id]) ? '#ecfdf5' : '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                              {SERVICE_ICONS[cat.name.toLowerCase()] || '⚙️'}
                            </div>
                            <div>
                              <strong style={{ fontSize: '1.05rem', color: '#1e3a8a', display: 'block' }}>{cat.name}</strong>
                              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <button className="cd-action-btn" style={{ background: 'none', color: '#64748b', padding: 0, fontSize: '0.75rem', textDecoration: 'underline' }} onClick={() => { setEditingCatId(cat.id); setCatForm({ name: cat.name }); }}>Edit Name</button>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <button className="cd-action-btn" style={{ background: 'none', color: '#ef4444', padding: 0, fontSize: '0.75rem', textDecoration: 'underline' }} onClick={async () => { if (window.confirm('Delete category globally?')) { const { deleteRMSCategory, getAdminRMSCategories } = await import('./api'); await deleteRMSCategory(token, cat.id); getAdminRMSCategories(token).then(setRmsCats); } }}>Delete</button>
                              </div>
                            </div>
                          </div>

                          {/* ENABLE/DISABLE TOGGLE RIGHT HERE */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: (rmsAptMappings[selectedAptForRMS.id] && rmsAptMappings[selectedAptForRMS.id][cat.id]) ? '#16a34a' : '#94a3b8' }}>
                              {(rmsAptMappings[selectedAptForRMS.id] && rmsAptMappings[selectedAptForRMS.id][cat.id]) ? 'ACTIVE' : 'DISABLED'}
                            </span>
                            <label className="cd-toggle-switch" style={{ transform: 'scale(0.85)' }}>
                              <input
                                type="checkbox"
                                checked={!!(rmsAptMappings[selectedAptForRMS.id] && rmsAptMappings[selectedAptForRMS.id][cat.id])}
                                onChange={async (e) => {
                                  const { updateApartmentRMSMapping, getApartmentRMSMappings } = await import('./api');
                                  await updateApartmentRMSMapping(token, selectedAptForRMS.id, cat.id, e.target.checked);
                                  getApartmentRMSMappings(token, selectedAptForRMS.id).then(m => setRmsAptMappings(prev => ({ ...prev, [selectedAptForRMS.id]: m })));
                                }}
                              />
                              <span className="cd-toggle-slider" />
                            </label>
                          </div>
                        </div>

                        {/* Subcategories (Only visible if enabled for this apt? Or always managed? Best to always managed) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1rem', borderLeft: '3.5px solid #edf2f7' }}>
                          {cat.subcategories.map(sub => (
                            <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid transparent', hover: { borderColor: '#3b5bdb' } }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: sub.priority_level === 0 ? '#ef4444' : sub.priority_level === 1 ? '#f59e0b' : sub.priority_level === 2 ? '#3b5bdb' : '#94a3b8', boxShadow: sub.priority_level === 0 ? '0 0 6px #ef444455' : 'none' }} />
                                <span style={{ fontWeight: 600, color: '#334155' }}>{sub.name}</span>
                                <span style={{ color: '#64748b', fontSize: '0.75rem', background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{sub.sla_time || 'No SLA'}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#3b5bdb', cursor: 'pointer', padding: '2px 6px', borderRadius: '6px' }} onClick={() => { setEditingSubId(sub.id); setSubForm({ name: sub.name, priority_level: sub.priority_level, category_id: sub.category_id, sla_time: sub.sla_time || '' }); }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#ef4444', cursor: 'pointer', padding: '2px 6px', borderRadius: '6px' }} onClick={async () => { if (window.confirm('Delete sub-unit?')) { const { deleteRMSSubcategory, getAdminRMSCategories } = await import('./api'); await deleteRMSSubcategory(token, sub.id); getAdminRMSCategories(token).then(setRmsCats); } }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                              </div>
                            </div>
                          ))}

                          <div style={{ marginTop: '0.75rem', background: '#eff6ff', padding: '1rem', borderRadius: '14px', border: '1.5px solid #dbeafe' }}>
                            <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 800, color: '#3b5bdb', textTransform: 'uppercase', letterSpacing: '0.03em' }}>⚡ Add Sub-unit to {cat.name}</p>
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              const { createRMSSubcategory, patchRMSSubcategory, getAdminRMSCategories } = await import('./api');
                              if (editingSubId) await patchRMSSubcategory(token, editingSubId, subForm);
                              else await createRMSSubcategory(token, { ...subForm, category_id: cat.id });
                              setSubForm({ name: '', priority_level: 2, category_id: null, sla_time: '' }); setEditingSubId(null);
                              getAdminRMSCategories(token).then(setRmsCats);
                            }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <input style={{ flex: '1 1 160px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px', border: '1.5px solid #bfdbfe', background: '#fff' }} placeholder="Sub-unit Name (e.g. Broken Tap)" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} required />
                              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                <select style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem', borderRadius: '8px', border: '1.5px solid #bfdbfe', background: '#fff' }} value={subForm.priority_level} onChange={e => setSubForm({ ...subForm, priority_level: parseInt(e.target.value) })}>
                                  <option value={0}>Urgent (P0)</option>
                                  <option value={1}>High (P1)</option>
                                  <option value={2}>Medium (P2)</option>
                                  <option value={3}>Low (P3)</option>
                                </select>
                                <input style={{ width: '100px', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '8px', border: '1.5px solid #bfdbfe', background: '#fff' }} placeholder="SLA (2h)" value={subForm.sla_time} onChange={e => setSubForm({ ...subForm, sla_time: e.target.value })} />
                                <button type="submit" className="cd-save-btn" style={{ padding: '0 1.25rem', fontSize: '0.8rem' }}>{editingSubId ? 'Update' : 'Add'}</button>
                                {editingSubId && <button type="button" className="cd-cancel-btn" style={{ padding: '0.5rem' }} onClick={() => { setEditingSubId(null); setSubForm({ name: '', priority_level: 2, category_id: null, sla_time: '' }); }}>✕</button>}
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTIVE REQUESTS FOR SELECTED APT */}
                <div className="cd-profile-card">
                  <h3 className="cd-profile-info-title">Active Requests for {selectedAptForRMS.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>Real-time monitoring of tickets raised by residents in this complex.</p>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="cd-table" style={{ width: '100%', fontSize: '0.88rem' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Request</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Priority</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rmsRequests.filter(r => r.user_id && /* We need to filter by apartment - let's assume we can fetch apt-specific or filter locally */
                          true // For now showing all requests to keep it simple, but filtering by selectedApt would be better
                        ).length === 0 ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No active requests for this complex.</td></tr>
                        ) : (
                          rmsRequests.map(req => (
                            <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem', fontWeight: 700, color: '#64748b' }}>#RQ-{req.id}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ fontWeight: 800, color: '#1e3a8a' }}>{req.category.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.subcategory.name}</div>
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{
                                  padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800,
                                  background: req.priority_level === 0 ? '#fee2e2' : req.priority_level === 1 ? '#ffedd5' : '#eff6ff',
                                  color: req.priority_level === 0 ? '#ef4444' : req.priority_level === 1 ? '#f59e0b' : '#3b5bdb'
                                }}>
                                  {req.priority_level === 0 ? 'Urgent' : req.priority_level === 1 ? 'High' : 'Medium'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>{req.status}</span>
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>{timeAgo(req.created_at)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* RECENT REQUESTS MONITOR */}
            <div className="cd-profile-card" style={{ marginTop: '1.5rem' }}>
              <h3 className="cd-profile-info-title">Active Requests Monitor</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #edf2f7' }}>
                      {['ID', 'Category', 'Status', 'Priority', 'Created', 'Assigned To', 'Evidence'].map(h => <th key={h} style={{ padding: '1rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rmsRequests.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No active RMS requests found.</td></tr>}
                    {rmsRequests.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f0f2f8' }}>
                        <td style={{ padding: '1rem 0.75rem', fontWeight: 700, color: '#1e3a8a' }}>#RQ{r.id}</td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{r.category?.name || '---'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.subcategory?.name || '---'}</div>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                            background: r.status === 'Completed' ? '#dcfce7' : r.status === 'In Progress' ? '#eff6ff' : r.status === 'Assigned' ? '#fef3c7' : '#f1f5f9',
                            color: r.status === 'Completed' ? '#16a34a' : r.status === 'In Progress' ? '#3b5bdb' : r.status === 'Assigned' ? '#d97706' : '#64748b'
                          }}>{r.status}</span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.75rem',
                            color: r.priority_level === 0 ? '#ef4444' : r.priority_level === 1 ? '#f59e0b' : r.priority_level === 2 ? '#3b5bdb' : '#64748b'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.priority_level === 0 ? '#ef4444' : r.priority_level === 1 ? '#f59e0b' : r.priority_level === 2 ? '#3b5bdb' : '#94a3b8' }} />
                            {r.priority_level === 0 ? 'Urgent' : r.priority_level === 1 ? 'High' : r.priority_level === 2 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem', color: '#64748b', fontSize: '0.82rem' }}>{timeAgo(r.created_at)}</td>
                        <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: '#1e293b' }}>
                          {r.worker_name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          {r.image_url ? (
                            <a href={getAbsUrl(r.image_url)} target="_blank" rel="noreferrer" style={{ color: '#3b5bdb', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>View Photo</a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminView === 'delivery-stats' && (
          <div style={{ padding: '1rem 0' }}>
            <h2 className="cd-section-title" style={{ marginBottom: '1.5rem' }}>🚚 Smart Delivery Intelligence</h2>
            <DeliveryAnalytics token={token} apartmentsList={apartmentsList} />
          </div>
        )}

        {adminView === 'extra_management' && (
          <div style={{ padding: '1rem 0', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="cd-section-title" style={{ margin: 0 }}>⭐ Marketplace Architecture</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => { setEditingExtraCatId(null); setExtraForm({ name: '', image_url: '', is_active: true }); setShowExtraCatModal(true); }}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', background: '#6366f1', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >+ New Category</button>
                <button
                  onClick={() => setAdminSelectedCat(null)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', background: '#f1f5f9', color: '#1e293b', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >Dashboard</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <button
                onClick={() => { setExtraAdminTab('design'); setAdminSelectedCat(null); }}
                style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: extraAdminTab === 'design' ? '3px solid #6366f1' : 'none', color: extraAdminTab === 'design' ? '#6366f1' : '#64748b', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
              >Visual Design</button>
              <button
                onClick={() => setExtraAdminTab('architecture')}
                style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: extraAdminTab === 'architecture' ? '3px solid #6366f1' : 'none', color: extraAdminTab === 'architecture' ? '#6366f1' : '#64748b', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
              >Service Hierarchy</button>
            </div>

            {!adminSelectedCat ? (
              /* ARCHITECTURE DASHBOARD */
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {extraAdminTab === 'design' && (
                  <>
                    {/* STATS SECTION */}
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '2rem' }}>⭐</div>
                          <div>
                            <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Service Rating</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{extraStats.rating_value}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '2rem' }}>👥</div>
                          <div>
                            <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Customers Served</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{extraStats.total_customers}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setStatsForm(extraStats); setShowStatsModal(true); }}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', background: '#f8fafc', color: '#6366f1', fontWeight: 700, border: '1.5px solid #edf2f7', cursor: 'pointer' }}
                        className="hover-lift"
                      >Edit Performance Stats</button>
                    </div>

                    {/* BANNERS SECTION */}
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>Promotional Grid (2x2)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxWidth: '400px' }}>
                        {extraBanners.slice(0, 4).map(b => (
                          <div key={b.id} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1.5px solid #edf2f7', aspectRatio: '1/1' }}>
                            <img src={getAbsUrl(b.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
                            <button
                              onClick={async (e) => { e.stopPropagation(); if (confirm("Delete banner?")) { try { await adminDeleteBanner(token, b.id); setExtraBanners(await getServiceBanners()); } catch (e) { alert(e.message); } } }}
                              style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                            >&times;</button>
                          </div>
                        ))}
                        {extraBanners.length < 4 && (
                          <div
                            onClick={() => document.getElementById('banner-upload').click()}
                            style={{
                              borderRadius: '24px',
                              border: '2px dashed #cbd5e1',
                              aspectRatio: '1/1',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              background: '#f8fafc',
                              color: '#64748b',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.5rem' }}>+</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Upload Banner</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="banner-upload"
                        hidden
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const uploadRes = await uploadFile(token, file);
                              await adminCreateBanner(token, { image_url: uploadRes.url, display_order: extraBanners.length });
                              setExtraBanners(await getServiceBanners());
                              alert("Banner uploaded successfully!");
                            } catch (err) {
                              alert("Upload failed: " + err.message);
                            }
                          }
                        }}
                      />
                    </div>
                  </>
                )}

                {extraAdminTab === 'architecture' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {extraCats.map(cat => (
                      <div key={cat.id} onClick={() => {
                        setAdminSelectedCat(cat);
                        import('./api').then(({ getServiceCategoryDetail }) => getServiceCategoryDetail(cat.id).then(res => setAdminSubCats(res.subcategories)));
                      }} style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid #edf2f7', cursor: 'pointer', position: 'relative' }} className="hover-lift">
                        <div style={{ display: 'flex', gap: '0.5rem', position: 'absolute', top: '1rem', right: '1rem' }}>
                          <button onClick={(e) => { e.stopPropagation(); setEditingExtraCatId(cat.id); setExtraForm({ name: cat.name, image_url: cat.image_url }); setShowExtraCatModal(true); }} style={{ background: '#f8fafc', border: '1px solid #edf2f7', padding: '5px', borderRadius: '8px', cursor: 'pointer' }}>✏️</button>
                          <button onClick={async (e) => { e.stopPropagation(); if (confirm("Delete category?")) { try { await adminDeleteCategory(token, cat.id); setExtraCats(await getServiceCategories()); } catch (err) { alert(err.message); } } }} style={{ background: '#fff1f2', border: '1px solid #fee2e2', padding: '5px', borderRadius: '8px', cursor: 'pointer' }}>🗑️</button>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f8fafc', marginBottom: '1rem', overflow: 'hidden' }}>
                          <img src={getAbsUrl(cat.image_url)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="cat" />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{cat.name}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure Hierarchy &rsaquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* HIERARCHY MANAGEMENT */
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflow: 'hidden' }}>
                {/* Panel 2: Subcategories */}
                <div style={{ flex: 1, background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Subcategories</h3>
                    <button onClick={() => { setEditingExtraSubId(null); setSubFormExtra({ title: '', group_name: '', display_order: 0, image_url: '' }); setShowExtraSubModal(true); }} style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {Object.entries(adminSubCats.reduce((acc, s) => { (acc[s.group_name] = acc[s.group_name] || []).push(s); return acc; }, {})).map(([group, subs]) => (
                      <div key={group} style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{group || 'Un-grouped'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {subs.map(s => (
                            <div key={s.id} onClick={() => {
                              setAdminSelectedSub(s);
                              import('./api').then(({ getServiceSubCategory }) => getServiceSubCategory(s.id).then(res => {
                                setAdminTypes(res.service_types);
                                const allSvcs = [];
                                res.service_types.forEach(t => allSvcs.push(...t.services));
                                setAdminServices(allSvcs);
                              }));
                            }} style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: adminSelectedSub?.id === s.id ? '#6366f1' : '#f8fafc', color: adminSelectedSub?.id === s.id ? '#fff' : '#1e293b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{s.title}</span>
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button onClick={(e) => { e.stopPropagation(); setEditingExtraSubId(s.id); setSubFormExtra({ title: s.title, group_name: s.group_name, display_order: s.display_order, image_url: s.image_url }); setShowExtraSubModal(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '2px', borderRadius: '4px', color: 'inherit', cursor: 'pointer' }}>✏️</button>
                                <button onClick={async (e) => { e.stopPropagation(); if (confirm("Delete subcategory?")) { try { await adminDeleteSubCategory(token, s.id); setAdminSubCats(adminSubCats.filter(x => x.id !== s.id)); } catch (err) { alert(err.message); } } }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '2px', borderRadius: '4px', color: 'inherit', cursor: 'pointer' }}>🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 3: Types & Services */}
                {adminSelectedSub && (
                  <div style={{ flex: 1.5, background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Types & Services</h3>
                      <button onClick={() => { setEditingExtraTypeId(null); setTypeFormExtra({ name: '', display_order: 0 }); setShowExtraTypeModal(true); }} style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>+ New Type</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {adminTypes.map(type => (
                        <div key={type.id} style={{ marginBottom: '2.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{type.name}</h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => { setEditingExtraTypeId(type.id); setTypeFormExtra({ name: type.name, display_order: type.display_order }); setShowExtraTypeModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>✏️</button>
                              <button onClick={async () => { if (confirm("Delete type?")) { try { await adminDeleteServiceType(token, type.id); setAdminTypes(adminTypes.filter(x => x.id !== type.id)); } catch (err) { alert(err.message); } } }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>🗑️</button>
                              <button onClick={() => { setAdminSelectedType(type); setEditingExtraSvcId(null); setServiceFormExtra({ title: '', description: '', price: 0, duration: '', display_order: 0 }); setShowExtraSvcModal(true); }} style={{ background: '#f1f5f9', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', cursor: 'pointer' }}>+ Service</button>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                            {adminServices.filter(s => s.type_id === type.id).map(svc => (
                              <div key={svc.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#1e293b' }}>{svc.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>₹{svc.price} &middot; {svc.duration}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => { setAdminSelectedType(type); setEditingExtraSvcId(svc.id); setServiceFormExtra({ ...svc }); setShowExtraSvcModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                                  <button onClick={async () => { if (confirm("Delete service?")) { try { await adminDeleteExtraService(token, svc.id); setAdminServices(adminServices.filter(x => x.id !== svc.id)); } catch (err) { alert(err.message); } } }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODALS */}
            {showExtraCatModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', maxWidth: '450px', width: '100%' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>{editingExtraCatId ? 'Edit' : 'Create'} Category</h2>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>NAME</label>
                    <input type="text" value={extraForm.name} onChange={e => setExtraForm({ ...extraForm, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Category Icon</label>
                    <div
                      onClick={() => document.getElementById('cat-icon-upload').click()}
                      style={{
                        padding: '1.5rem',
                        border: '2px dashed #e2e8f0',
                        borderRadius: '16px',
                        background: '#f8fafc',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      {extraForm.image_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                          <img src={getAbsUrl(extraForm.image_url)} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain' }} alt="icon preview" />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>✓ Icon Locked</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Click to replace</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🖼️</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>Upload Category Icon</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>PNG, SVG or JPG (Max 5MB)</div>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="cat-icon-upload"
                      hidden
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            setUploading(true);
                            const { url } = await uploadFile(token, file);
                            setExtraForm({ ...extraForm, image_url: url });
                            setUploading(false);
                          } catch (err) {
                            alert("Upload failed: " + err.message);
                            setUploading(false);
                          }
                        }
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowExtraCatModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '15px', background: '#f1f5f9', border: 'none', fontWeight: 800 }}>Cancel</button>
                    <button onClick={async () => {
                      try {
                        if (editingExtraCatId) await adminUpdateCategory(token, editingExtraCatId, extraForm);
                        else await adminCreateCategory(token, extraForm);
                        setExtraCats(await getServiceCategories());
                        setShowExtraCatModal(false);
                      } catch (e) { alert(e.message); }
                    }} style={{ flex: 2, padding: '1rem', borderRadius: '15px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800 }}>Save Category</button>
                  </div>
                </div>
              </div>
            )}

            {showExtraSubModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', maxWidth: '450px', width: '100%' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>{editingExtraSubId ? 'Edit' : 'New'} Subcategory</h2>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>GROUP NAME (e.g. Interior, Exterior)</label>
                    <input type="text" value={subFormExtra.group_name} onChange={e => setSubFormExtra({ ...subFormExtra, group_name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>SUBCAT TITLE</label>
                    <input type="text" value={subFormExtra.title} onChange={e => setSubFormExtra({ ...subFormExtra, title: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.8rem' }}>Subcategory Illustration (Optional)</label>
                    <div
                      onClick={() => document.getElementById('sub-upload').click()}
                      style={{ padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '12px', background: '#f8fafc', textAlign: 'center', cursor: 'pointer' }}
                    >
                      {subFormExtra.image_url ? (
                        <img src={getAbsUrl(subFormExtra.image_url)} style={{ height: '32px', borderRadius: '4px' }} alt="preview" />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>+ Upload Asset</span>
                      )}
                    </div>
                    <input type="file" id="sub-upload" hidden accept="image/*" onChange={async e => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const { url } = await uploadFile(token, file);
                          setSubFormExtra({ ...subFormExtra, image_url: url });
                        } catch (err) { alert(err.message); }
                      }
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowExtraSubModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '15px', background: '#f1f5f9', border: 'none', fontWeight: 800 }}>Cancel</button>
                    <button onClick={async () => {
                      try {
                        if (editingExtraSubId) await adminUpdateSubCategory(token, editingExtraSubId, { ...subFormExtra, category_id: adminSelectedCat.id });
                        else await adminCreateSubCategory(token, { ...subFormExtra, category_id: adminSelectedCat.id });
                        import('./api').then(({ getServiceCategoryDetail }) => getServiceCategoryDetail(adminSelectedCat.id).then(res => setAdminSubCats(res.subcategories)));
                        setShowExtraSubModal(false);
                      } catch (err) { alert(err.message); }
                    }} style={{ flex: 2, padding: '1rem', borderRadius: '15px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800 }}>Save</button>
                  </div>
                </div>
              </div>
            )}

            {showExtraTypeModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', maxWidth: '450px', width: '100%' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>{editingExtraTypeId ? 'Edit' : 'New'} Service Type</h2>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>TYPE NAME</label>
                    <input type="text" value={typeFormExtra.name} onChange={e => setTypeFormExtra({ ...typeFormExtra, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.8rem' }}>Type Icon (Optional)</label>
                    <div
                      onClick={() => document.getElementById('type-upload').click()}
                      style={{ padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '12px', background: '#f8fafc', textAlign: 'center', cursor: 'pointer' }}
                    >
                      {typeFormExtra.image_url ? (
                        <img src={getAbsUrl(typeFormExtra.image_url)} style={{ height: '32px', borderRadius: '4px' }} alt="preview" />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>+ Upload Icon</span>
                      )}
                    </div>
                    <input type="file" id="type-upload" hidden accept="image/*" onChange={async e => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const { url } = await uploadFile(token, file);
                          setTypeFormExtra({ ...typeFormExtra, image_url: url });
                        } catch (err) { alert(err.message); }
                      }
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowExtraTypeModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '15px', background: '#f1f5f9', border: 'none', fontWeight: 800 }}>Cancel</button>
                    <button onClick={async () => {
                      try {
                        if (editingExtraTypeId) await adminUpdateServiceType(token, editingExtraTypeId, { ...typeFormExtra, subcategory_id: adminSelectedSub.id });
                        else await adminCreateServiceType(token, { ...typeFormExtra, subcategory_id: adminSelectedSub.id });
                        import('./api').then(({ getServiceSubCategory }) => getServiceSubCategory(adminSelectedSub.id).then(res => setAdminTypes(res.service_types)));
                        setShowExtraTypeModal(false);
                      } catch (err) { alert(err.message); }
                    }} style={{ flex: 2, padding: '1rem', borderRadius: '15px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800 }}>Save</button>
                  </div>
                </div>
              </div>
            )}

            {showExtraSvcModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', padding: '2.0rem', borderRadius: '24px', maxWidth: '500px', width: '100%' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>{editingExtraSvcId ? 'Edit' : 'New'} Service</h2>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>TITLE</label>
                    <input type="text" value={serviceFormExtra.title} onChange={e => setServiceFormExtra({ ...serviceFormExtra, title: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700 }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>PRICE (₹)</label>
                      <input type="number" value={serviceFormExtra.price} onChange={e => setServiceFormExtra({ ...serviceFormExtra, price: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>DURATION</label>
                      <input type="text" value={serviceFormExtra.duration} onChange={e => setServiceFormExtra({ ...serviceFormExtra, duration: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.8rem' }}>Service Preview Image (Optional)</label>
                    <div
                      onClick={() => document.getElementById('svc-upload').click()}
                      style={{ padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '12px', background: '#f8fafc', textAlign: 'center', cursor: 'pointer' }}
                    >
                      {serviceFormExtra.image_url ? (
                        <img src={getAbsUrl(serviceFormExtra.image_url)} style={{ height: '32px', borderRadius: '4px' }} alt="preview" />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>+ Upload Service Photo</span>
                      )}
                    </div>
                    <input type="file" id="svc-upload" hidden accept="image/*" onChange={async e => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const { url } = await uploadFile(token, file);
                          setServiceFormExtra({ ...serviceFormExtra, image_url: url });
                        } catch (err) { alert(err.message); }
                      }
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button onClick={() => setShowExtraSvcModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '15px', background: '#f1f5f9', border: 'none', fontWeight: 800 }}>Cancel</button>
                    <button onClick={async () => {
                      try {
                        const payload = {
                          ...serviceFormExtra,
                          category_id: adminSelectedCat.id,
                          subcategory_id: adminSelectedSub.id,
                          type_id: adminSelectedType.id
                        };
                        if (editingExtraSvcId) await adminUpdateExtraService(token, editingExtraSvcId, payload);
                        else await adminCreateExtraService(token, payload);

                        import('./api').then(({ getServiceSubCategory }) => getServiceSubCategory(adminSelectedSub.id).then(res => {
                          setAdminTypes(res.service_types);
                          const allSvcs = [];
                          res.service_types.forEach(t => allSvcs.push(...t.services));
                          setAdminServices(allSvcs);
                        }));
                        setShowExtraSvcModal(false);
                      } catch (err) { alert(err.message); }
                    }} style={{ flex: 2, padding: '1rem', borderRadius: '15px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800 }}>Save</button>
                  </div>
                </div>
              </div>
            )}

            {/* STATS EDIT MODAL */}
            {showStatsModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Edit Marketplace Stats</h2>
                    <button onClick={() => setShowStatsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Average Service Rating</label>
                    <input
                      type="text"
                      value={statsForm.rating_value}
                      onChange={e => setStatsForm({ ...statsForm, rating_value: e.target.value })}
                      placeholder="e.g. 4.9"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700, fontSize: '1rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total Customers Served</label>
                    <input
                      type="text"
                      value={statsForm.total_customers}
                      onChange={e => setStatsForm({ ...statsForm, total_customers: e.target.value })}
                      placeholder="e.g. 15M+"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #edf2f7', fontWeight: 700, fontSize: '1rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowStatsModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '15px', background: '#f1f5f9', border: 'none', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                    <button
                      onClick={async () => {
                        try {
                          await adminUpdateStats(token, statsForm);
                          setExtraStats({ ...statsForm });
                          setShowStatsModal(false);
                          alert("Performance statistics updated successfully!");
                        } catch (e) { alert(e.message); }
                      }}
                      style={{ flex: 1.5, padding: '1rem', borderRadius: '15px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
                    >Save Changes</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REVENUE & PAYMENTS ── */}
        {adminView === 'payments' && (
           <div style={{animation:'fadeIn 0.6s ease-out'}}>
              <h2 className="cd-section-title" style={{marginBottom:'2.5rem'}}>💰 Society Revenue & Payment Logs</h2>
              
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'2rem', marginBottom:'3.5rem'}}>
                      {/* Dynamic Marketplace & Maintenance Data Integration */}
                      {(() => {
                         const maintenanceGoal = adminMaintData.reduce((sum, apt) => sum + (apt.total_residents * (apt.plan?.maintenance_charge || 0)), 0);
                         const marketplaceRevenue = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
                         const grossRev = maintenanceGoal + marketplaceRevenue; // Note: for simplicity using Goal as revenue, in real app would use 'paid' status
                         
                         return (
                           <>
                           <div style={{background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding:'2.5rem', borderRadius:'32px', color:'#fff', position:'relative', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(15, 23, 42, 0.4)', border:'1px solid rgba(255,255,255,0.05)'}}>
                              <div style={{position:'absolute', right:'-40px', bottom:'-40px', width:'200px', height:'200px', background:'rgba(99,102,241,0.1)', borderRadius:'50%', filter:'blur(45px)'}} />
                              <div style={{fontSize:'0.8rem', fontWeight:800, opacity:0.6, marginBottom:'0.8rem', letterSpacing:'1.5px'}}>GROSS REVENUE ({new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}).toUpperCase()})</div>
                              <div style={{fontSize:'3.2rem', fontWeight:900, letterSpacing:'-1px'}}>₹{grossRev.toLocaleString()}</div>
                              <div style={{display:'flex', gap:'2rem', marginTop:'2.5rem'}}>
                                 <div>
                                    <div style={{fontSize:'0.7rem', fontWeight:900, color:'#6366f1', marginBottom:'0.3rem', letterSpacing:'0.5px'}}>MAINTENANCE</div>
                                    <div style={{fontSize:'1.2rem', fontWeight:900}}>₹{maintenanceGoal.toLocaleString()}</div>
                                 </div>
                                 <div>
                                    <div style={{fontSize:'0.7rem', fontWeight:900, color:'#10b981', marginBottom:'0.3rem', letterSpacing:'0.5px'}}>MARKETPLACE</div>
                                    <div style={{fontSize:'1.2rem', fontWeight:900}}>₹{marketplaceRevenue.toLocaleString()}</div>
                                 </div>
                              </div>
                           </div>
                           
                           <div style={{background:'#fff', padding:'2.2rem', borderRadius:'32px', border:'1px solid #e2e8f0', textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                              <div style={{width:'85px', height:'85px', background:'#eff2ff', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem', margin:'0 auto 1.5rem', boxShadow:'inset 0 0 20px rgba(99,102,241,0.08)'}}>📊</div>
                              <h4 style={{fontSize:'1.25rem', fontWeight:900, color:'#1e293b', marginBottom:'0.4rem'}}>Financial Health</h4>
                              <p style={{fontSize:'0.9rem', color:'#64748b', fontWeight:700}}>Collection trending +18% vs last month</p>
                              <button style={{marginTop:'1.8rem', width:'100%', padding:'1.1rem', borderRadius:'18px', background:'#1e293b', color:'#fff', border:'none', fontWeight:900, cursor:'pointer'}} className="hover-lift">Generate Monthly Report</button>
                           </div>
                           </>
                         )
                      })()}

                 <div style={{background:'#fff', padding:'2.2rem', borderRadius:'32px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.8rem', alignItems:'center'}}>
                       <span style={{fontSize:'0.95rem', fontWeight:900, color:'#1e293b'}}>Verified Settlement</span>
                       <span style={{color:'#10b981', fontSize:'0.7rem', fontWeight:900, background:'#f0fdf4', padding:'4px 10px', borderRadius:'100px'}}>PROTECTED</span>
                    </div>
                    {[1,2,3].map(i => (
                       <div key={i} style={{height:'42px', width:'100%', background:'#f8fafc', borderRadius:'12px', marginBottom:'0.6rem', display:'flex', alignItems:'center', padding:'0 1.2rem', fontSize:'0.75rem', color:'#475569', fontWeight:800, border:'1px solid #f1f5f9'}}>
                          <div style={{width:'8px', height:'8px', background:'#10b981', borderRadius:'50%', marginRight:'1rem', boxShadow:'0 0 8px #10b981'}} />
                          PG Node {i}: Secure Connection
                       </div>
                    ))}
                 </div>
              </div>

              <div className="cd-profile-card" style={{borderLeft:'4px solid #1e293b'}}>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2.5rem', flexWrap:'wrap', gap:'1.5rem'}}>
                    <h3 className="cd-profile-info-title" style={{margin:0}}>Global Society Logs</h3>
                    <div style={{display:'flex', gap:'1rem', flex:1, maxWidth:'500px'}}>
                       <input type="text" placeholder="Search by ID, Flat or Resident..." style={{padding:'0.85rem 1.4rem', borderRadius:'18px', border:'1.8px solid #f1f5f9', fontSize:'0.9rem', width:'100%', outline:'none', fontWeight:600}} />
                       <button style={{padding:'0.85rem 1.8rem', borderRadius:'18px', background:'#6366f1', color:'#fff', border:'none', fontWeight:900, cursor:'pointer'}} className="hover-lift">Filter</button>
                    </div>
                 </div>

                 <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                       <thead>
                          <tr style={{textAlign:'left', borderBottom:'2px solid #f1f5f9'}}>
                             <th style={{padding:'1.4rem', fontSize:'0.78rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>ID REF</th>
                             <th style={{padding:'1.4rem', fontSize:'0.78rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>RESIDENT</th>
                             <th style={{padding:'1.4rem', fontSize:'0.78rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>FLAT / UNIT</th>
                             <th style={{padding:'1.4rem', fontSize:'0.78rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>AMOUNT</th>
                             <th style={{padding:'1.4rem', fontSize:'0.78rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>TRANSACTION</th>
                             <th style={{padding:'1.4rem', fontSize:'0.78rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>TIMESTAMP</th>
                             <th style={{padding:'1.4rem', fontSize:'0.78rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px'}}>STATUS</th>
                          </tr>
                       </thead>
                       <tbody>
                          {[
                             ...bookings.map(b => ({
                                id: `TXN-${b.id}-BK`, 
                                res: b.service_name || 'Resident', 
                                unit: b.location || 'Suite-X', 
                                amount: Number(b.price) || 0, 
                                cat: 'Marketplace', 
                                time: new Date(b.date).toLocaleDateString()
                             })),
                             ...adminMaintData.slice(0, 8).map(m => ({
                                id: `TXN-${m.apartment_id}-MN`,
                                res: m.apartment_name,
                                unit: 'CORE-PLAN',
                                amount: m.plan?.maintenance_charge || 0,
                                cat: 'Maintenance',
                                time: 'Billing Cycle'
                             }))
                          ].map((p, idx) => (
                             <tr key={idx} style={{borderBottom:'1.2px solid #f8fafc', transition:'0.3s'}} className="hover-lift">
                                <td style={{padding:'1.6rem 1.4rem', fontSize:'0.85rem', fontWeight:800, color:'#1e293b'}}>{p.id}</td>
                                <td style={{padding:'1.6rem 1.4rem', fontSize:'0.88rem', color:'#1e293b', fontWeight:700}}>{p.res}</td>
                                <td style={{padding:'1.6rem 1.4rem', fontSize:'0.85rem', color:'#64748b', fontWeight:700}}>{p.unit}</td>
                                <td style={{padding:'1.6rem 1.4rem', fontSize:'1rem', fontWeight:900, color:'#1e293b'}}>₹{p.amount.toLocaleString()}</td>
                                <td style={{padding:'1.6rem 1.4rem'}}>
                                   <span style={{fontSize:'0.65rem', fontWeight:900, padding:'0.4rem 0.9rem', background: p.cat==='Maintenance' ? '#eff6ff' : '#fef2f2', color: p.cat==='Maintenance' ? '#3b82f6' : '#ef4444', borderRadius:'8px', textTransform:'uppercase', letterSpacing:'0.5px'}}>{p.cat}</span>
                                </td>
                                <td style={{padding:'1.6rem 1.4rem', fontSize:'0.82rem', color:'#94a3b8', fontWeight:700}}>{p.time}</td>
                                <td style={{padding:'1.6rem 1.4rem'}}>
                                   <div style={{display:'flex', alignItems:'center', gap:'0.6rem', color:'#10b981', fontSize:'0.75rem', fontWeight:900}}>
                                      <div style={{width:'8px', height:'8px', background:'#10b981', borderRadius:'50%', boxShadow:'0 0 10px rgba(16,185,129,0.5)'}} /> VERIFIED
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};



// CORE APP WRAPPER & DATA FETCHING
const DashboardWrapper = ({ token, logout }) => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const reloadBookings = async () => {
    try {
      const { getBookings, getComplaints } = await import('./api');
      const b = await getBookings(token);
      setBookings(b);
      const c = await getComplaints(token);
      setComplaints(c);
    } catch (e) { }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getMe(token);
        setUser(u);
        const s = await getServices(token);
        setServices(s);
        await reloadBookings();
      } catch (err) {
        logout();
      }
    };
    fetchData();

    // Background Real-Time Synchronization Matrix
    const pollId = setInterval(() => {
      reloadBookings().catch(() => { });
    }, 5000);

    return () => clearInterval(pollId);
  }, [token]);

  if (!user) return <div className="app-container">Loading Systems...</div>;

  return (
    <div className={user.role === 'worker' ? "app-container" : ""}>
      {user.role === 'worker' && (
        <div className="dashboard-header">
          <div>
            <h1 style={{ margin: 0, color: 'var(--text)' }}>FixNest Platform <span style={{ fontSize: '1rem', color: 'gray' }}>(WORKER)</span></h1>
            <p style={{ margin: 0, color: 'gray' }}>Authenticated as {user.mobile_number || user.email}</p>
          </div>
          <button className="btn" style={{ width: 'auto', background: 'var(--error)' }} onClick={logout}>Sign Out</button>
        </div>
      )}

      {user.role === 'customer' && <CustomerDashboard user={user} token={token} logout={logout} complaints={complaints} reloadBookings={reloadBookings} />}
      {user.role === 'admin' && <AdminDashboard token={token} complaints={complaints} bookings={bookings} reloadBookings={reloadBookings} logout={logout} />}
      {user.role === 'worker' && <WorkerDashboard token={token} bookings={bookings} complaints={complaints} services={services} logout={logout} />}
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('fixnest_token'));

  const handleSetToken = (t) => {
    localStorage.setItem('fixnest_token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('fixnest_token');
    setToken(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!token ? <Auth setToken={handleSetToken} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={token ? <DashboardWrapper token={token} logout={handleLogout} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
