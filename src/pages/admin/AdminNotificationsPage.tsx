
import React from 'react';
import AdminNotifications from '@/components/admin/AdminNotifications';

const AdminNotificationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <AdminNotifications />
    </div>
  );
};

export default AdminNotificationsPage;
