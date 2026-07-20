import { useEffect, useState } from "react";
import api from "../../services/api";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import "./AdminCategories.css";

function AdminCategories() {

    const [categories, setCategories] = useState([]);

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [editing, setEditing] = useState(null);

    const [form, setForm] = useState({
        name: "",
        description: ""
    });

    useEffect(() => {

        loadCategories();

    }, []);

    const loadCategories = async () => {

        try {

            const res = await api.get("/categories");

            setCategories(res.data.data || res.data);

        } catch (err) {

            console.log(err);

        }

    };

    const saveCategory = async () => {

        try {

            if (editing) {

                await api.put(`/categories/${editing.id}`, form);

            } else {

                await api.post("/categories", form);

            }

            setShowModal(false);

            setEditing(null);

            setForm({
                name: "",
                description: ""
            });

            loadCategories();

        } catch (err) {

            alert(err.response?.data?.message);

        }

    };

    const editCategory = (category) => {

        setEditing(category);

        setForm({
            name: category.name,
            description: category.description || ""
        });

        setShowModal(true);

    };

    const deleteCategory = async (id) => {

        if (!window.confirm("Delete Category?")) return;

        await api.delete(`/categories/${id}`);

        loadCategories();

    };

    const filtered = categories.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <div className="category-page">

            <div className="page-header">

                <h1>Categories</h1>

                <button
                    className="add-btn"
                    onClick={() => {

                        setEditing(null);

                        setForm({
                            name: "",
                            description: ""
                        });

                        setShowModal(true);

                    }}
                >

                    <Plus size={18} />

                    Add Category

                </button>

            </div>

            <div className="search-box">

                <Search size={18} />

                <input
                    placeholder="Search category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            <table>

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Name</th>

                        <th>Description</th>

                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        filtered.map((cat, index) => (

                            <tr key={cat.id}>

                                <td>{index + 1}</td>

                                <td>{cat.name}</td>

                                <td>{cat.description}</td>

                                <td>

                                    <button
                                        onClick={() => editCategory(cat)}
                                    >

                                        <Edit size={18} />

                                    </button>

                                    <button
                                        onClick={() => deleteCategory(cat.id)}
                                    >

                                        <Trash2 size={18} />

                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

            {

                showModal && (

                    <div className="modal">

                        <div className="modal-content">

                            <h2>

                                {

                                    editing

                                        ? "Edit Category"

                                        : "Add Category"

                                }

                            </h2>

                            <input
                                placeholder="Category Name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value
                                    })
                                }
                            />

                            <textarea
                                placeholder="Description"
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value
                                    })
                                }
                            />

                            <button
                                onClick={saveCategory}
                            >

                                Save

                            </button>

                        </div>

                    </div>

                )

            }

        </div>

    );

}

export default AdminCategories;