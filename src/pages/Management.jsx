import React, { useState } from "react";

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
    <div style={styles.container}>
      <h1 style={styles.title}>Employee Management</h1>
      
      <div style={styles.grid}>
        {employees.map((employee) => (
          <div key={employee.id} style={styles.card}>
            {editingId === employee.id ? (
              <>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  style={styles.cardInput}
                  placeholder="Name"
                />
                {employee.email}
                {/*<input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  style={styles.cardInput}
                  placeholder="Email"
                />*/}
                <div style={styles.buttonRow}>
                  <button onClick={() => saveEdit(employee.id)} style={styles.saveButton}>Save</button>
                  <button onClick={() => deleteEmployee(employee.uid)} style={styles.deleteButton}>Delete</button>
                  <button onClick={cancelEdit} style={styles.cancelButton}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={styles.name}>{employee.name}</h2>
                <p style={styles.email}>{employee.email}</p>
                <button onClick={() => startEditing(employee)} style={styles.editButton}>Edit</button>
              </>
            )}
          </div>
        ))}

        {/* Add new employee card */}
        <div style={{ ...styles.card, ...styles.addCard }}>
          {newEmployeeMode ? (
            <>
              <input
                type="text"
                value={newEmployeeData.name}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, name: e.target.value })}
                style={styles.cardInput}
                placeholder="Name"
              />
              <input
                type="email"
                value={newEmployeeData.email}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, email: e.target.value })}
                style={styles.cardInput}
                placeholder="Email"
              />
              <div style={styles.buttonRow}>
                <button onClick={handleAddNew} style={styles.saveButton}>Add</button>
                <button onClick={() => setNewEmployeeMode(false)} style={styles.cancelButton}>Cancel</button>
              </div>
            </>
          ) : (
            <button onClick={() => setNewEmployeeMode(true)} style={styles.plusButton}>
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
  },
  card: {
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  addCard: {
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  name: {
    margin: "0",
  },
  email: {
    margin: "0",
    color: "#555",
  },
  editButton: {
    marginTop: "0.5rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#1976D2",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  saveButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#9E9E9E",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cardInput: {
    width: "100%",
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  plusButton: {
    fontSize: "3rem",
    backgroundColor: "#1976D2",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  buttonRow: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
};

export default Management;
