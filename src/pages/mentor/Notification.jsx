import { useEffect, useState } from "react";
import axios from "axios";
import "./Notification.css";

function MentorNotification() {

    const [students, setStudents] = useState([]);

    const [notification, setNotification] = useState({
        studentId: "",
        title: "",
        message: "",
        type: "INFO"
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    // ===========================
    // Fetch Students
    // ===========================

    const fetchStudents = async () => {

        try {

            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const users = response.data.data || [];

            const studentUsers = users.filter(
                (user) => user.role === "STUDENT"
            );

            setStudents(studentUsers);

        }

        catch (err) {

            console.log(err);

            alert("Unable to fetch students.");

        }

    };

    // ===========================
    // Send Notification
    // ===========================

    const sendNotification = async () => {

        if (
            !notification.studentId ||
            !notification.title.trim() ||
            !notification.message.trim()
        ) {

            alert("Please fill all fields.");

            return;

        }

        try {

            const token = localStorage.getItem("token");

            await axios.post(

                "http://localhost:5000/api/notifications",

                {
                    studentId: notification.studentId,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type
                },

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );

            alert("Notification sent successfully.");

            setNotification({
                studentId: "",
                title: "",
                message: "",
                type: "INFO"
            });

        }

        catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Unable to send notification."
            );

        }

    };

    return (

        <div className="mentor-notification">

            <div className="notification-header">

                <h1>
                    Send Notification
                </h1>

                <p>
                    Send notifications to students.
                </p>

            </div>

            <div className="notification-card">

                <label>
                    Select Student
                </label>

                <select
                    value={notification.studentId}
                    onChange={(e) =>
                        setNotification({
                            ...notification,
                            studentId: Number(e.target.value)
                        })
                    }
                >

                    <option value="">
                        Select Student
                    </option>

                    {

                        students.map((student) => (

                            <option
                                key={student.id}
                                value={student.id}
                            >

                                {student.id} - {student.name}

                            </option>

                        ))

                    }

                </select>

                <label>
                    Title
                </label>

                <input
                    type="text"
                    placeholder="Enter notification title"
                    value={notification.title}
                    onChange={(e) =>
                        setNotification({
                            ...notification,
                            title: e.target.value
                        })
                    }
                />

                <label>
                    Message
                </label>

                <textarea
                    rows="6"
                    placeholder="Write your message..."
                    value={notification.message}
                    onChange={(e) =>
                        setNotification({
                            ...notification,
                            message: e.target.value
                        })
                    }
                />

                <label>
                    Type
                </label>

                <select
                    value={notification.type}
                    onChange={(e) =>
                        setNotification({
                            ...notification,
                            type: e.target.value
                        })
                    }
                >

                    <option value="INFO">
                        INFO
                    </option>

                    <option value="SUCCESS">
                        SUCCESS
                    </option>

                    <option value="WARNING">
                        WARNING
                    </option>

                    <option value="REMINDER">
                        REMINDER
                    </option>

                </select>

                <button
                    className="send-btn"
                    onClick={sendNotification}
                >

                    📤 Send Notification

                </button>

            </div>

        </div>

    );

}

export default MentorNotification;