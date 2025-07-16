
import React from 'react';
import AdminChatManagement from '@/components/admin/AdminChatManagement';

const AdminChatManagementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Chat Management</h1>
      <AdminChatManagement />
    </div>
  );
};

export default AdminChatManagementPage;
