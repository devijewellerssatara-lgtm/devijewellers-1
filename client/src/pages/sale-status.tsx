import React from "react";

export default function SaleStatus() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center">
            <i className="fas fa-tags text-white text-xl" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Sale Status</h1>
          <p className="text-gray-600">Monitor and manage current sale status</p>
        </header>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-center text-gray-600">
            <i className="fas fa-info-circle mr-2"></i>
            <span>This is a placeholder page. Add your sale status content here.</span>
          </div>
        </div>
      </div>
    </div>
  );
}