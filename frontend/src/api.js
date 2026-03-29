export const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
};

export const sendOtp = async (mobile_number) => {
  const res = await fetch(`${API_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number })
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to send OTP");
  }
  return res.json();
};

export const verifyOtp = async (mobile_number, otp) => {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number, otp })
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to verify OTP");
  }
  return res.json();
};

export const registerCustomer = async (data) => {
  const res = await fetch(`${API_URL}/auth/register-customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to register");
  }
  return res.json();
};

export const getMe = async (token) => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
};

export const updateCustomerProfile = async (token, profileData) => {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
};

export const getServices = async () => {
    const res = await fetch(`${API_URL}/services`);
    return res.json();
};

export const getBookings = async (token) => {
  const res = await fetch(`${API_URL}/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const createBooking = async (token, service_id, date, time_slot, location) => {
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ service_id, date, time_slot, location })
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to book");
  }
  return res.json();
};

export const deleteComplaint = async (token, complaint_id) => {
  const res = await fetch(`${API_URL}/complaints/${complaint_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to delete");
  }
  return res.json();
};

export const raiseComplaint = async (token, complaint_type, description) => {
  const res = await fetch(`${API_URL}/complaints`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ complaint_type, description })
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to raise complaint");
  }
  return res.json();
};

export const getApartments = async () => {
    const res = await fetch(`${API_URL}/apartments`);
    return res.json();
};

export const getBlocks = async (apartment_id) => {
    const res = await fetch(`${API_URL}/apartments/${apartment_id}/blocks`);
    return res.json();
};

export const addApartment = async (token, name, code) => {
  const res = await fetch(`${API_URL}/apartments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ name, code })
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to add apartment");
  }
  return res.json();
};

export const addBlock = async (token, apartment_id, block_name) => {
  const res = await fetch(`${API_URL}/apartments/${apartment_id}/blocks`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ apartment_id, block_name })
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to add block");
  }
  return res.json();
};

export const deleteApartment = async (token, apartment_id) => {
  const res = await fetch(`${API_URL}/apartments/${apartment_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete apartment");
  }
  return res.json();
};

export const deleteBlock = async (token, block_id) => {
  const res = await fetch(`${API_URL}/blocks/${block_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete block");
  }
  return res.json();
};

export const getDepartments = async () => {
  const res = await fetch(`${API_URL}/admin/departments`);
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
};

export const addDepartment = async (token, name) => {
  const res = await fetch(`${API_URL}/admin/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add department");
  }
  return res.json();
};

export const deleteDepartment = async (token, id) => {
  const res = await fetch(`${API_URL}/admin/departments/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete department");
  return res.json();
};

export const getClusters = async () => {
  const res = await fetch(`${API_URL}/admin/clusters`);
  if (!res.ok) throw new Error("Failed to fetch clusters");
  return res.json();
};

export const addCluster = async (token, name) => {
  const res = await fetch(`${API_URL}/admin/clusters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add cluster");
  }
  return res.json();
};

export const deleteCluster = async (token, id) => {
  const res = await fetch(`${API_URL}/admin/clusters/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete cluster");
  return res.json();
};

export const deleteWorker = async (token, id) => {
  const res = await fetch(`${API_URL}/admin/workers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(errData.detail || "Failed to delete worker");
  }
  return res.json();
};

export const createVisitorPass = async (token, data) => {
  const res = await fetch(`${API_URL}/visitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create visitor pass");
  return res.json();
};

export const getMyVisitors = async (token) => {
  const res = await fetch(`${API_URL}/visitors/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const extendVisitorStay = async (token, visitor_id, new_checkout) => {
  const res = await fetch(`${API_URL}/visitors/extend/${visitor_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ new_check_out_time: new_checkout })
  });
  if (!res.ok) throw new Error("Failed to extend stay");
  return res.json();
};

export const verifyVisitorPass = async (token, decodedText) => {
  let secure_token = decodedText;
  try {
    const parsed = JSON.parse(decodedText);
    if (parsed && typeof parsed === 'object' && parsed.secure_token) secure_token = parsed.secure_token;
    else if (parsed && typeof parsed === 'object' && parsed.visitor_id) {
       // fallback for old QR codes if needed, but the new system uses secure_token
       throw new Error("Old QR code format. Please regenerate.");
    }
  } catch (e) { /* treat as raw token */ }

  const res = await fetch(`${API_URL}/visitors/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ secure_token })
  });
  if (!res.ok) {
     const err = await res.json();
     let errorMsg = Array.isArray(err.detail) ? err.detail.map(e => e.msg).join(", ") : (err.detail || "Verification failed");
     throw new Error(errorMsg);
  }
  return res.json();
};

export const getVisitorStats = async (token) => {
  const res = await fetch(`${API_URL}/admin/visitors/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getActiveVisitors = async (token) => {
  const res = await fetch(`${API_URL}/admin/visitors/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getAllVisitors = async (token, flat_id = '', status = '') => {
  let url = `${API_URL}/admin/visitors/all?`;
  if (flat_id) url += `flat_id=${encodeURIComponent(flat_id)}&`;
  if (status) url += `status=${encodeURIComponent(status)}&`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getComplaints = async (token) => {
  const res = await fetch(`${API_URL}/complaints`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const triggerScheduler = async (token) => {
  const res = await fetch(`${API_URL}/scheduler/process`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to trigger Admin Scheduler Process");
  }
  return res.json();
};

export const getWorkers = async (token) => {
  const res = await fetch(`${API_URL}/workers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getMyWorkerProfile = async (token) => {
  const res = await fetch(`${API_URL}/workers/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateWorkerProfile = async (token, profileData) => {
  const res = await fetch(`${API_URL}/workers/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
};

export const getAttendance = async (token, date) => {
  const res = await fetch(`${API_URL}/admin/attendance?date=${date}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const markAttendance = async (token, worker_id, date, status) => {
  const res = await fetch(`${API_URL}/admin/attendance`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ worker_id, date, status })
  });
  if (!res.ok) throw new Error("Failed to mark attendance");
  return res.json();
};

export const deleteBooking = async (token, booking_id) => {
  const res = await fetch(`${API_URL}/bookings/${booking_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to violently purge ticket");
  return res.json();
};

export const getAdminWorkers = async (token) => {
  const res = await fetch(`${API_URL}/admin/workers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch workers");
  return res.json();
};

export const createAdminWorker = async (token, workerData) => {
  const res = await fetch(`${API_URL}/admin/workers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(workerData)
  });
  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create worker");
  }
  return res.json();
};

export const resetWorkerPassword = async (token, worker_id) => {
  const res = await fetch(`${API_URL}/admin/workers/${worker_id}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to reset password");
  return res.json();
};

export const downloadWorkersExcel = async (token) => {
  const res = await fetch(`${API_URL}/admin/workers/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to download excel");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "fixnest_workers_data.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const getAdminCustomers = async (token) => {
  const res = await fetch(`${API_URL}/admin/customers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch admin customers");
  return res.json();
};

export const resetCustomerPassword = async (token, customer_id) => {
  const res = await fetch(`${API_URL}/admin/customers/${customer_id}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to reset password");
  return res.json();
};

export const deleteCustomer = async (token, customer_id) => {
  const res = await fetch(`${API_URL}/admin/customers/${customer_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete customer");
  return res.json();
};

export const downloadCustomersExcel = async (token) => {
  const res = await fetch(`${API_URL}/admin/customers/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to download excel");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "fixnest_customers_data.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// ── Announcements ──────────────────────────────
export const getAnnouncements = async (token) => {
  const res = await fetch(`${API_URL}/announcements`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch announcements");
  return res.json();
};

export const getAdminAnnouncements = async (token) => {
  const res = await fetch(`${API_URL}/admin/announcements`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch announcements");
  return res.json();
};

export const createAnnouncement = async (token, data) => {
  const res = await fetch(`${API_URL}/admin/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create announcement");
  }
  return res.json();
};

export const deleteAnnouncement = async (token, id) => {
  const res = await fetch(`${API_URL}/admin/announcements/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete announcement");
  return res.json();
};

// ── Apartment Maintenance ──────────────────────────────
export const getAdminMaintenance = async (token) => {
  const res = await fetch(`${API_URL}/admin/maintenance`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch maintenance data");
  return res.json();
};

export const createMaintenancePlan = async (token, data) => {
  const res = await fetch(`${API_URL}/admin/maintenance-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to create plan"); }
  return res.json();
};

export const updateMaintenancePlan = async (token, planId, data) => {
  const res = await fetch(`${API_URL}/admin/maintenance-plan/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to update plan"); }
  return res.json();
};

export const addMaintenanceService = async (token, planId, data) => {
  const res = await fetch(`${API_URL}/admin/maintenance-plan/${planId}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to add service"); }
  return res.json();
};

export const updateMaintenanceService = async (token, planId, serviceId, data) => {
  const res = await fetch(`${API_URL}/admin/maintenance-plan/${planId}/services/${serviceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to update service"); }
  return res.json();
};

export const deleteMaintenanceService = async (token, planId, serviceId) => {
  const res = await fetch(`${API_URL}/admin/maintenance-plan/${planId}/services/${serviceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to delete service"); }
  return res.json();
};

export const getMyMaintenancePlan = async (token) => {
  const res = await fetch(`${API_URL}/customer/maintenance`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("No plan found");
  return res.json();
};

// ── RMS API ──────────────────────────────
export const getAdminRMSCategories = async (token) => {
  const res = await fetch(`${API_URL}/admin/rms/categories`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const createRMSCategory = async (token, name) => {
  const res = await fetch(`${API_URL}/admin/rms/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  return res.json();
};

export const patchRMSCategory = async (token, id, name) => {
  const res = await fetch(`${API_URL}/admin/rms/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  return res.json();
};

export const deleteRMSCategory = async (token, id) => {
  const res = await fetch(`${API_URL}/admin/rms/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const createRMSSubcategory = async (token, data) => {
  const res = await fetch(`${API_URL}/admin/rms/subcategories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const patchRMSSubcategory = async (token, id, data) => {
  const res = await fetch(`${API_URL}/admin/rms/subcategories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteRMSSubcategory = async (token, id) => {
  const res = await fetch(`${API_URL}/admin/rms/subcategories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getApartmentRMSMappings = async (token, aptId) => {
  const res = await fetch(`${API_URL}/admin/rms/apartments/${aptId}/mappings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateApartmentRMSMapping = async (token, aptId, category_id, is_enabled) => {
  const res = await fetch(`${API_URL}/admin/rms/apartments/${aptId}/mappings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ category_id, is_enabled })
  });
  return res.json();
};

export const getAdminRMSRequests = async (token) => {
  const res = await fetch(`${API_URL}/admin/rms/requests`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getCustomerRMSCategories = async (token) => {
  const res = await fetch(`${API_URL}/rms/categories`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const raiseRMSRequest = async (token, data) => {
  const res = await fetch(`${API_URL}/rms/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to raise request"); }
  return res.json();
};

export const getMyRMSRequests = async (token) => {
  const res = await fetch(`${API_URL}/rms/requests`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};
export const uploadFile = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

// ── Delivery & Parcel Management ──────────────────────────────
export const createDeliveryRequest = async (token, data) => {
  const res = await fetch(`${API_URL}/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to create delivery request"); }
  return res.json();
};

export const getMyDeliveries = async (token) => {
  const res = await fetch(`${API_URL}/deliveries/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getActiveDeliveries = async (token) => {
  const res = await fetch(`${API_URL}/deliveries/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const performDeliveryAction = async (token, delivery_id, action, image_url = null) => {
  const res = await fetch(`${API_URL}/deliveries/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ delivery_id, action, image_url })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed to perform action"); }
  return res.json();
};

export const verifyDeliveryOTP = async (token, delivery_id, otp) => {
  const res = await fetch(`${API_URL}/deliveries/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ delivery_id, otp })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Verification failed"); }
  return res.json();
};

export const getDeliveryStats = async (token) => {
  const res = await fetch(`${API_URL}/admin/deliveries/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// ── Extra Services Marketplace ──
export const getServiceCategories = async () => {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
};

export const getServiceCategoryDetail = async (id) => {
    const res = await fetch(`${API_URL}/categories/${id}`);
    if (!res.ok) throw new Error("Failed to fetch category detail");
    return res.json();
};

export const getServiceSubCategory = async (id) => {
    const res = await fetch(`${API_URL}/subcategories/${id}`);
    if (!res.ok) throw new Error("Failed to fetch subcategory detail");
    return res.json();
};

export const getServiceBanners = async () => {
    const res = await fetch(`${API_URL}/banners`);
    if (!res.ok) throw new Error("Failed to fetch banners");
    return res.json();
};

export const getServiceStats = async () => {
    const res = await fetch(`${API_URL}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
};

// Admin
export const adminCreateCategory = async (token, data) => {
    const res = await fetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create category");
    }
    return res.json();
};

export const adminUpdateCategory = async (token, id, data) => {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
};

export const adminDeleteCategory = async (token, id) => {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to delete category");
    return res.json();
};

export const adminCreateSubCategory = async (token, data) => {
    const res = await fetch(`${API_URL}/admin/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const adminUpdateSubCategory = async (token, id, data) => {
    const res = await fetch(`${API_URL}/admin/subcategories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const adminDeleteSubCategory = async (token, id) => {
    const res = await fetch(`${API_URL}/admin/subcategories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const adminCreateServiceType = async (token, data) => {
    const res = await fetch(`${API_URL}/admin/service-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const adminUpdateServiceType = async (token, id, data) => {
    const res = await fetch(`${API_URL}/admin/service-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const adminDeleteServiceType = async (token, id) => {
    const res = await fetch(`${API_URL}/admin/service-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const adminCreateExtraService = async (token, data) => {
    const res = await fetch(`${API_URL}/admin/extra-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const adminUpdateExtraService = async (token, id, data) => {
    const res = await fetch(`${API_URL}/admin/extra-services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const adminDeleteExtraService = async (token, id) => {
    const res = await fetch(`${API_URL}/admin/extra-services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const adminUpdateStats = async (token, data) => {
    const res = await fetch(`${API_URL}/admin/stats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update stats");
    return res.json();
};

export const adminCreateBanner = async (token, data) => {
    const res = await fetch(`${API_URL}/admin/banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create banner");
    return res.json();
};

export const adminDeleteBanner = async (token, id) => {
    const res = await fetch(`${API_URL}/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to delete banner");
    return res.json();
};

