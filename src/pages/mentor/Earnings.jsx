// pages/mentor/Earnings.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import {
  IndianRupee,
  Wallet,
  BookOpen,
  Users
} from "lucide-react";
import "./Earnings.css";

function MentorEarnings() {

  const [earnings, setEarnings] = useState({
    totalRevenue: 0,
    mentorShare: 0,
    pendingPayout: 0,
    totalEnrollments: 0,
    totalCourses: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/earnings/mentor",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEarnings(response.data.data);

    } catch (err) {

      console.error("Unable to fetch earnings", err);

    } finally {

      setLoading(false);

    }

  };

  if (loading) {

    return (
      <div className="loading">
        Loading Earnings...
      </div>
    );

  }

  return (

    <div className="mentor-earnings">

      <div className="earnings-header">

        <h1>My Earnings</h1>

        <p>
          Track your course revenue and enrollments.
        </p>

      </div>

      <div className="earnings-grid">

        <div className="earning-card">

          <div className="card-icon revenue">

            <IndianRupee size={28} />

          </div>

          <div>

            <h4>Total Revenue</h4>

            <h2>
              ₹{earnings.totalRevenue.toLocaleString()}
            </h2>

          </div>

        </div>

        <div className="earning-card">

          <div className="card-icon share">

            <Wallet size={28} />

          </div>

          <div>

            <h4>Mentor Share</h4>

            <h2>
              ₹{earnings.mentorShare.toLocaleString()}
            </h2>

          </div>

        </div>

        <div className="earning-card">

          <div className="card-icon payout">

            <IndianRupee size={28} />

          </div>

          <div>

            <h4>Pending Payout</h4>

            <h2>
              ₹{earnings.pendingPayout.toLocaleString()}
            </h2>

          </div>

        </div>

        <div className="earning-card">

          <div className="card-icon enrollments">

            <Users size={28} />

          </div>

          <div>

            <h4>Total Enrollments</h4>

            <h2>
              {earnings.totalEnrollments}
            </h2>

          </div>

        </div>

        <div className="earning-card">

          <div className="card-icon courses">

            <BookOpen size={28} />

          </div>

          <div>

            <h4>Total Courses</h4>

            <h2>
              {earnings.totalCourses}
            </h2>

          </div>

        </div>

      </div>

    </div>

  );

}

export default MentorEarnings;