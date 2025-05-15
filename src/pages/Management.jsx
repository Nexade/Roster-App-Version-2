import React, { useState } from "react";
import "../styles/Management.css";

const Management = ({ employees, addEmployee, updateEmployee, deleteEmployee }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "", email: "" });
  const [newEmployeeMode, setNewEmployeeMode] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({ name: "", email: "" });

  const startEditing = (employee) => {
    setEditingId(employee.id);
    setEditData({ name: employee.name, email: employee.email });
  };

  const saveEdit = async (id) => {
    await updateEmployee(id, editData);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleAddNew = async () => {
    if (newEmployeeData.name.trim() && newEmployeeData.email.trim()) {
      await addEmployee(newEmployeeData);
      setNewEmployeeData({ name: "", email: "" });
      setNewEmployeeMode(false);
    }
  };

  return (
    <div className="management-container">
      <h1 className="management-title">Employee Management</h1>
      
      <div className="employee-grid">
        {employees.map((employee) => (
          <div key={employee.id} className="employee-card">
            {editingId === employee.id ? (
              <>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="card-input"
                  placeholder="Name"
                />
                {employee.email}
                <div className="button-row">
                  <button onClick={() => saveEdit(employee.id)} className="save-button">Save</button>
                  <button onClick={() => deleteEmployee(employee.uid)} className="delete-button">Delete</button>
                  <button onClick={cancelEdit} className="cancel-button">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="employee-name">{employee.name}</h2>
                <p className="employee-email">{employee.email}</p>
                <button onClick={() => startEditing(employee)} className="edit-button">Edit</button>
              </>
            )}
          </div>
        ))}
  
        {/* Add new employee card */}
        <div className={`employee-card ${newEmployeeMode ? '' : 'add-employee-card'}`}>
          {newEmployeeMode ? (
            <>
              <input
                type="text"
                value={newEmployeeData.name}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, name: e.target.value })}
                className="card-input"
                placeholder="Name"
              />
              <input
                type="email"
                value={newEmployeeData.email}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, email: e.target.value })}
                className="card-input"
                placeholder="Email"
              />
              <div className="button-row">
                <button onClick={handleAddNew} className="save-button">Add</button>
                <button onClick={() => setNewEmployeeMode(false)} className="cancel-button">Cancel</button>
              </div>
            </>
          ) : (
            <button onClick={() => setNewEmployeeMode(true)} className="plus-button">
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


export default Management;
