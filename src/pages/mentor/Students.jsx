import { useEffect, useState } from "react";
import axios from "axios";
import "./Students.css";

function MentorStudents() {

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {

    try {

      const token = localStorage.getItem("token");

     const response = await axios.get(
  "http://localhost:5000/api/assignments",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

      console.log("Users API Response:", response.data);
      console.log(JSON.stringify(response.data.data, null, 2));
  
const assignments = response.data.data || [];

const studentMap = new Map();
const students = [];

assignments.forEach((assignment) => {

  assignment.course.enrollments.forEach((enrollment) => {

    const student = enrollment.student;

    if (!studentMap.has(student.id)) {

      studentMap.set(student.id, true);

      students.push({

        id: student.id,

        name: student.name,

        email: student.email,

        course: assignment.course.title,

        progress: enrollment.progress,

        status: enrollment.completed
          ? "Completed"
          : "Active"

      });

    }

  });

});

setStudents(students);

    } catch (err) {

      console.error("Unable to fetch students:", err);

      setStudents([]);

    }

  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="mentor-students">

      <div className="students-header">

        <div>

          <h1>My Students</h1>

          <p>
            Monitor enrolled students and their learning progress.
          </p>

        </div>

        <input
          type="text"
          className="search-box"
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      <div className="students-table">

        <table>

          <thead>

            <tr>

              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Progress</th>
              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {filteredStudents.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "20px"
                  }}
                >
                  No students found.
                </td>

              </tr>

            ) : (

              filteredStudents.map((student) => (

                <tr key={student.id}>

                  <td>{student.name}</td>

                  <td>{student.email}</td>

                  <td>{student.course}</td>

                  <td>

                    <div className="progress-container">

                      <div className="progress-bar">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${student.progress}%`
                          }}
                        />

                      </div>

                      <span>{student.progress}%</span>

                    </div>

                  </td>

                  <td>

                    <span className={`status ${student.status.toLowerCase()}`}>
                      {student.status}
                    </span>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default MentorStudents;