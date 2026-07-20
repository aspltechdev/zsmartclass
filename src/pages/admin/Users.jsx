// import { useEffect, useState } from "react";
// import api from "../../services/api";
// import { Plus, Search, Trash2, Edit } from "lucide-react";
// import "./AdminUsers.css";

// export default function AdminUsers() {

//     const [users, setUsers] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [search, setSearch] = useState("");

//     const [role, setRole] = useState("");

//     const [showModal, setShowModal] = useState(false);

//     const [form, setForm] = useState({

//         name: "",

//         email: "",

//         password: "",

//         role: "STUDENT"

//     });

//     useEffect(() => {

//         fetchUsers();

//     }, []);

//     // const fetchUsers = async () => {

//     //     try {

//     //         const res = await api.get("/users");

//     //         setUsers(res.data.data);

//     //     } catch (err) {

//     //         console.log(err);

//     //     } finally {

//     //         setLoading(false);

//     //     }

//     // };
// const fetchUsers = async () => {

//     const token = localStorage.getItem("token");

//     console.log("TOKEN FROM LOCAL STORAGE:", token);

//     try {

//         const res = await api.get("/users");

//         console.log(res.data);

//         setUsers(res.data.data);

//     } catch (err) {

//         console.log(err.response);

//     } finally {

//         setLoading(false);

//     }

// };
//     const createUser = async () => {

//         try {

//             await api.post("/users", form);

//             setShowModal(false);

//             fetchUsers();

//         } catch (err) {

//             alert(err.response?.data?.message);

//         }

//     };

//     const deleteUser = async (id) => {

//         if (!window.confirm("Delete User?")) return;

//         await api.delete(`/users/${id}`);

//         fetchUsers();

//     };

//     const filteredUsers = users.filter((u) => {

//         const matchesSearch =
//             u.name.toLowerCase().includes(search.toLowerCase()) ||
//             u.email.toLowerCase().includes(search.toLowerCase());

//         const matchesRole =
//             role === "" || u.role === role;

//         return matchesSearch && matchesRole;

//     });

//     return (

//         <div className="users-page">

//             <div className="users-header">

//                 <h1>User Management</h1>

//                 <button

//                     onClick={() => setShowModal(true)}

//                     className="add-btn"

//                 >

//                     <Plus size={18} />

//                     Add User

//                 </button>

//             </div>

//             <div className="cards">

//                 <div className="card">

//                     <h2>{users.length}</h2>

//                     <p>Total Users</p>

//                 </div>

//                 <div className="card">

//                     <h2>

//                         {users.filter(u => u.role === "STUDENT").length}

//                     </h2>

//                     <p>Students</p>

//                 </div>

//                 <div className="card">

//                     <h2>

//                         {users.filter(u => u.role === "MENTOR").length}

//                     </h2>

//                     <p>Mentors</p>

//                 </div>

//                 <div className="card">

//                     <h2>

//                         {users.filter(u => u.role === "ADMIN").length}

//                     </h2>

//                     <p>Admins</p>

//                 </div>

//             </div>

//             <div className="toolbar">

//                 <div className="search">

//                     <Search size={18} />

//                     <input

//                         placeholder="Search"

//                         value={search}

//                         onChange={(e) => setSearch(e.target.value)}

//                     />

//                 </div>

//                 <select

//                     value={role}

//                     onChange={(e) => setRole(e.target.value)}

//                 >

//                     <option value="">All Roles</option>

//                     <option>ADMIN</option>

//                     <option>MENTOR</option>

//                     <option>STUDENT</option>

//                 </select>

//             </div>

//             <table>

//                 <thead>

//                     <tr>

//                         <th>Name</th>

//                         <th>Email</th>

//                         <th>Role</th>

//                         <th>Verified</th>

//                         <th>Action</th>

//                     </tr>

//                 </thead>

//                 <tbody>

//                     {

//                         filteredUsers.map((user) => (

//                             <tr key={user.id}>

//                                 <td>{user.name}</td>

//                                 <td>{user.email}</td>

//                                 <td>{user.role}</td>

//                                 <td>

//                                     {

//                                         user.emailVerified

//                                             ? "✅"

//                                             : "❌"

//                                     }

//                                 </td>

//                                 <td>

//                                     <button>

//                                         <Edit size={18} />

//                                     </button>

//                                     <button

//                                         onClick={() => deleteUser(user.id)}

//                                     >

//                                         <Trash2 size={18} />

//                                     </button>

//                                 </td>

//                             </tr>

//                         ))

//                     }

//                 </tbody>

//             </table>

//             {

//                 showModal && (

//                     <div className="modal">

//                         <div className="modal-content">

//                             <h2>Create User</h2>

//                             <input

//                                 placeholder="Name"

//                                 onChange={(e) =>

//                                     setForm({

//                                         ...form,

//                                         name: e.target.value

//                                     })

//                                 }

//                             />

//                             <input

//                                 placeholder="Email"

//                                 onChange={(e) =>

//                                     setForm({

//                                         ...form,

//                                         email: e.target.value

//                                     })

//                                 }

//                             />

//                             <input

//                                 placeholder="Password"

//                                 type="password"

//                                 onChange={(e) =>

//                                     setForm({

//                                         ...form,

//                                         password: e.target.value

//                                     })

//                                 }

//                             />

//                             <select

//                                 onChange={(e) =>

//                                     setForm({

//                                         ...form,

//                                         role: e.target.value

//                                     })

//                                 }

//                             >

//                                 <option>STUDENT</option>

//                                 <option>MENTOR</option>

//                                 <option>ADMIN</option>

//                             </select>

//                             <button onClick={createUser}>

//                                 Create User

//                             </button>

//                         </div>

//                     </div>

//                 )

//             }

//         </div>

//     );

// }


import { useEffect, useState } from "react";
import api from "../../services/api";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AdminUsers.css";

export default function AdminUsers() {
    const { token, isAuthenticated, loading: authLoading } = useAuth();
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "STUDENT"
    });

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchUsers();
        } else if (!authLoading) {
            // Not authenticated and not loading - redirect to login
            window.location.href = "/login";
        }
    }, [isAuthenticated, token, authLoading]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/users");
            setUsers(res.data.data || res.data);
        } catch (err) {
            console.error("Error fetching users:", err);
            if (err.response?.status === 401) {
                // Token expired - will be handled by interceptor
                return;
            }
            alert(err.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const createUser = async () => {
        // Basic validation
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            await api.post("/users", form);
            setShowModal(false);
            setForm({
                name: "",
                email: "",
                password: "",
                role: "STUDENT"
            });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create user");
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }
        
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete user");
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = role === "" || u.role === role;
        return matchesSearch && matchesRole;
    });

    // Show loading while auth is initializing
    if (authLoading || loading) {
        return (
            <div className="users-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="users-page">
            <div className="users-header">
                <h1>User Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="add-btn"
                >
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            <div className="cards">
                <div className="card">
                    <h2>{users.length}</h2>
                    <p>Total Users</p>
                </div>
                <div className="card">
                    <h2>
                        {users.filter(u => u.role === "STUDENT").length}
                    </h2>
                    <p>Students</p>
                </div>
                <div className="card">
                    <h2>
                        {users.filter(u => u.role === "MENTOR").length}
                    </h2>
                    <p>Mentors</p>
                </div>
                <div className="card">
                    <h2>
                        {users.filter(u => u.role === "ADMIN").length}
                    </h2>
                    <p>Admins</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="search">
                    <Search size={18} />
                    <input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="STUDENT">Student</option>
                </select>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="empty-state">
                    <p>No users found matching your criteria.</p>
                </div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Verified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    {user.emailVerified ? "✅" : "❌"}
                                </td>
                                <td>
                                    <button
                                        className="edit-btn"
                                        onClick={() => {/* Add edit logic */}}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteUser(user.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Create New User</h2>
                        <input
                            placeholder="Full Name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <input
                            placeholder="Email Address"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <input
                            placeholder="Password"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="STUDENT">Student</option>
                            <option value="MENTOR">Mentor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <div className="modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowModal(false);
                                    setForm({
                                        name: "",
                                        email: "",
                                        password: "",
                                        role: "STUDENT"
                                    });
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="create-btn"
                                onClick={createUser}
                                disabled={!form.name || !form.email || !form.password}
                            >
                                Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}