// src/pages/student/Certificates.jsx

import React, { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  Send,
  AlertCircle,
  RefreshCw,
  Loader2,
  Lock,
  XCircle,
  X,
} from "lucide-react";

import api from "../../services/api";
import "./Certificates.css";
import "./StudentShared.css";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [eligibilityMap, setEligibilityMap] = useState({});
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingCertificate, setDownloadingCertificate] = useState(null);

  // Full-name entry modal (the name printed on the certificate is entered here).
  const [applyModal, setApplyModal] = useState(null); // { courseId, courseTitle }
  const [nameInput, setNameInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });

  // ==========================================================
  // LOAD — certificates + enrolled courses, then eligibility
  // ==========================================================

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    const [certRes, enrRes] = await Promise.allSettled([
      api.get("/certificates/my-certificates"),
      api.get("/enrollments/my-courses"),
    ]);

    // --- certificates ---
    let certs = [];
    if (certRes.status === "fulfilled") {
      const body = certRes.value?.data;
      certs = Array.isArray(body?.data) ? body.data : [];
    } else {
      setMessage({
        type: "error",
        text:
          certRes.reason?.response?.data?.message ||
          "Unable to load your certificates.",
      });
    }
    setCertificates(certs);

    // --- enrolled courses ---
    let enrs = [];
    if (enrRes.status === "fulfilled") {
      const body = enrRes.value?.data;
      enrs = Array.isArray(body?.data) ? body.data : [];
    }
    setEnrollments(enrs);

    setLoading(false);

    // A course can be applied for only if it has no certificate yet (in ANY
    // status — the backend keeps one certificate per course and returns the
    // existing one for repeat requests). Check eligibility only for those.
    const certCourseIds = new Set(
      certs.map((c) => Number(c.courseId)).filter(Boolean)
    );
    const applicable = enrs.filter((e) => {
      const cid = getEnrollmentCourseId(e);
      return cid && !certCourseIds.has(cid);
    });

    fetchEligibilityFor(applicable);
  };

  const fetchEligibilityFor = async (courses) => {
    if (!courses.length) {
      setEligibilityMap({});
      return;
    }

    setEligibilityLoading(true);

    const entries = await Promise.all(
      courses.map(async (course) => {
        const courseId = getEnrollmentCourseId(course);
        try {
          const res = await api.get(`/certificates/eligibility/${courseId}`);
          const data = res?.data?.data || {};
          return [courseId, { ...data, error: false }];
        } catch (err) {
          return [
            courseId,
            {
              eligible: false,
              reasons: [
                err.response?.data?.message ||
                  "Couldn't check eligibility. Please refresh.",
              ],
              error: true,
            },
          ];
        }
      })
    );

    setEligibilityMap(Object.fromEntries(entries));
    setEligibilityLoading(false);
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getEnrollmentCourseId = (enrollment) =>
    Number(enrollment?.courseId ?? enrollment?.course?.id) || null;

  const getCourseId = (certificate) =>
    certificate?.courseId ||
    certificate?.course?.id ||
    certificate?.Course?.id ||
    null;

  const getCourseName = (certificate) =>
    certificate?.courseTitle ||
    certificate?.course?.title ||
    certificate?.Course?.title ||
    certificate?.courseName ||
    "Course";

  const getStatus = (certificate) =>
    String(certificate?.status || "").toUpperCase();

  const isApproved = (certificate) => {
    const status = getStatus(certificate);
    return (
      status === "APPROVED" ||
      status === "ACTIVE" ||
      status === "ISSUED" ||
      status === "COMPLETED"
    );
  };

  const isPending = (certificate) => {
    const status = getStatus(certificate);
    return status === "PENDING" || status === "REQUESTED";
  };

  const isRejected = (certificate) => getStatus(certificate) === "REJECTED";

  // ==========================================================
  // APPLY FOR CERTIFICATE
  // ==========================================================

  const openApplyModal = (courseId, courseTitle) => {
    setApplyModal({ courseId, courseTitle });
    setNameInput("");
    setModalError("");
  };

  const closeApplyModal = () => {
    if (submitting) return;
    setApplyModal(null);
    setNameInput("");
    setModalError("");
  };

  const requestCertificate = async (courseId, studentName) => {
    if (!courseId) {
      setModalError("Course information is missing.");
      return;
    }

    const name = String(studentName || "").trim();
    if (!name) {
      setModalError("Please enter your full name.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      // POST /api/certificates/generate/:courseId  { studentName }
      const response = await api.post(
        `/certificates/generate/${courseId}`,
        { studentName: name }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to request certificate."
        );
      }

      setApplyModal(null);
      setNameInput("");
      setMessage({
        type: "success",
        text:
          response.data?.data?.message ||
          "Certificate request submitted for admin approval.",
      });

      // Refresh: the new PENDING certificate now shows in the list and the
      // course drops out of the "apply" section.
      await loadAll();
    } catch (error) {
      setModalError(
        error.response?.data?.message ||
          error.message ||
          "Unable to request certificate."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // DOWNLOAD CERTIFICATE
  // ==========================================================

  const downloadCertificate = async (certificate) => {
    const certificateNo = certificate?.certificateNo;

    if (!certificateNo) {
      setMessage({
        type: "error",
        text: "Certificate number is not available.",
      });
      return;
    }

    try {
      setDownloadingCertificate(certificateNo);
      setMessage({ type: "", text: "" });

      // GET /api/certificates/download/:certificateNo
      const response = await api.get(
        `/certificates/download/${certificateNo}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to download certificate."
        );
      }

      const data = response.data?.data;
      const pdfData =
        data?.pdf || data?.pdfBuffer || data?.file || data?.pdfData;

      if (!pdfData) {
        throw new Error("Certificate PDF is not available.");
      }

      let blob;

      if (typeof pdfData === "string") {
        let base64 = pdfData;
        if (base64.includes("base64,")) {
          base64 = base64.split("base64,")[1];
        }
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: "application/pdf" });
      } else {
        blob = new Blob([pdfData], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data?.filename || `Certificate_${certificateNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to download certificate.",
      });
    } finally {
      setDownloadingCertificate(null);
    }
  };

  // ==========================================================
  // DERIVED — courses eligible to apply for
  // ==========================================================

  const certCourseIds = new Set(
    certificates.map((c) => Number(c.courseId)).filter(Boolean)
  );

  const applicableCourses = enrollments.filter((e) => {
    const cid = getEnrollmentCourseId(e);
    return cid && !certCourseIds.has(cid);
  });

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="certificates-page">
        <div className="certificates-loading">
          <div className="certificate-loader" />
          <h3>Loading certificates...</h3>
          <p>Please wait while we load your certificate information.</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="certificates-page">

      {/* ===================================================== HEADER */}
      <div className="certificates-header">
        <div className="certificates-heading">
          <div className="certificates-heading-icon">
            <Award size={28} />
          </div>
          <div>
            <h1>My Certificates</h1>
          </div>
        </div>

        <button
          type="button"
          className="certificate-refresh-btn"
          onClick={loadAll}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* ===================================================== MESSAGE */}
      {message.text && (
        <div className={`certificate-message ${message.type}`}>
          {message.type === "success" ? (
            <CheckCircle size={19} />
          ) : (
            <AlertCircle size={19} />
          )}
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage({ type: "", text: "" })}
          >
            ×
          </button>
        </div>
      )}

      {/* ===================================================== APPLY SECTION */}
      {applicableCourses.length > 0 && (
        <div className="certificates-section">
          <div className="certificates-section-header">
            <div>
              <h2>Apply for a Certificate</h2>
              <p>
                Finish all lessons, pass every module quiz, and submit each
                assignment to unlock your certificate.
              </p>
            </div>
            <div className="course-count">
              {applicableCourses.length}{" "}
              {applicableCourses.length === 1 ? "Course" : "Courses"}
            </div>
          </div>

          <div className="certificate-list">
            {applicableCourses.map((enrollment) => {
              const courseId = getEnrollmentCourseId(enrollment);
              const courseName =
                enrollment?.course?.title ||
                enrollment?.courseTitle ||
                "Course";

              const elig = eligibilityMap[courseId];
              const checking = eligibilityLoading && !elig;
              const eligible = elig?.eligible === true;
              const reasons =
                Array.isArray(elig?.reasons) && elig.reasons.length
                  ? elig.reasons
                  : ["Complete all course requirements to unlock your certificate."];

              return (
                <div className="certificate-card" key={`apply-${courseId}`}>
                  <div className="certificate-card-header">
                    <div className="certificate-course-icon">
                      <Award size={24} />
                    </div>

                    <div className="certificate-course-info">
                      <h3>{courseName}</h3>
                      <span>Certificate not requested yet</span>
                    </div>

                    {!checking && eligible && (
                      <div className="certificate-eligible-badge">
                        <CheckCircle size={15} />
                        Eligible
                      </div>
                    )}
                    {!checking && !eligible && (
                      <div className="certificate-locked-badge">
                        <Lock size={15} />
                        Not yet eligible
                      </div>
                    )}
                  </div>

                  <div className="certificate-card-body" style={{ display: "block" }}>
                    {checking ? (
                      <div className="certificate-checking">
                        <Loader2 size={16} />
                        Checking your eligibility…
                      </div>
                    ) : eligible ? (
                      <div className="certificate-eligible-note">
                        <CheckCircle size={18} />
                        <span>
                          You've completed everything for this course. Enter
                          your name to request your certificate.
                        </span>
                      </div>
                    ) : (
                      <ul className="certificate-reasons">
                        {reasons.map((reason, i) => (
                          <li key={i}>
                            <AlertCircle size={15} />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="certificate-card-actions">
                    <button
                      type="button"
                      className="apply-certificate-btn"
                      onClick={() => openApplyModal(courseId, courseName)}
                      disabled={!eligible || checking}
                    >
                      <Send size={17} />
                      Apply for Certificate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================== MY CERTIFICATES */}
      <div className="certificates-section">
        <div className="certificates-section-header">
          <div>
            <h2>My Certificates</h2>
            <p>Track the status of your certificate requests.</p>
          </div>
          <div className="course-count">
            {certificates.length}{" "}
            {certificates.length === 1 ? "Certificate" : "Certificates"}
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="certificate-empty">
            <div className="certificate-empty-icon">
              <BookOpen size={40} />
            </div>
            <h3>No Certificates Yet</h3>
            <p>
              Complete an enrolled course to become eligible, then apply for
              your certificate.
            </p>
          </div>
        ) : (
          <div className="certificate-list">
            {certificates.map((certificate) => {
              const courseId = getCourseId(certificate);
              const courseName = getCourseName(certificate);
              const approved = isApproved(certificate);
              const pending = isPending(certificate);
              const rejected = isRejected(certificate);

              return (
                <div
                  className="certificate-card"
                  key={
                    certificate?.id ||
                    certificate?.certificateNo ||
                    courseId
                  }
                >
                  <div className="certificate-card-header">
                    <div className="certificate-course-icon">
                      <Award size={24} />
                    </div>

                    <div className="certificate-course-info">
                      <h3>{courseName}</h3>
                      {certificate?.certificateNo && (
                        <span>
                          Certificate No: {certificate.certificateNo}
                        </span>
                      )}
                    </div>

                    {approved && (
                      <div className="certificate-approved-badge">
                        <CheckCircle size={15} />
                        Approved
                      </div>
                    )}
                    {pending && (
                      <div className="certificate-pending-badge">
                        <Clock size={15} />
                        Pending Approval
                      </div>
                    )}
                    {rejected && (
                      <div className="certificate-rejected-badge">
                        <XCircle size={15} />
                        Not Approved
                      </div>
                    )}
                  </div>

                  <div className="certificate-card-body">
                    <div className="certificate-info-item">
                      <span>Course</span>
                      <strong>{courseName}</strong>
                    </div>

                    <div className="certificate-info-item">
                      <span>Issue Date</span>
                      <strong>
                        {certificate?.issueDate
                          ? new Date(
                              certificate.issueDate
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Not issued yet"}
                      </strong>
                    </div>
                  </div>

                  <div className="certificate-card-actions">
                    {pending && (
                      <div className="certificate-waiting">
                        <Clock size={18} />
                        <div>
                          <strong>Waiting for Approval</strong>
                          <span>
                            Your certificate request has been submitted for
                            admin review.
                          </span>
                        </div>
                      </div>
                    )}

                    {rejected && (
                      <div className="certificate-rejected">
                        <XCircle size={18} />
                        <div>
                          <strong>Request Not Approved</strong>
                          <span>
                            {certificate?.revokeReason ||
                              "Please contact your mentor or support for details."}
                          </span>
                        </div>
                      </div>
                    )}

                    {approved && (
                      <button
                        type="button"
                        className="download-certificate-btn"
                        onClick={() => downloadCertificate(certificate)}
                        disabled={
                          downloadingCertificate ===
                          certificate?.certificateNo
                        }
                      >
                        {downloadingCertificate ===
                        certificate?.certificateNo ? (
                          <>
                            <Loader2 size={17} className="button-spinner" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <Download size={17} />
                            Download Certificate
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================== APPLY MODAL */}
      {applyModal && (
        <div className="cert-modal-overlay" onClick={closeApplyModal}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cert-modal-header">
              <h3>
                <Award size={18} />
                Apply for Certificate
              </h3>
              <button
                type="button"
                className="cert-modal-close"
                onClick={closeApplyModal}
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cert-modal-body">
              <p>
                Enter your full name exactly as it should appear on the
                certificate for <strong>{applyModal.courseTitle}</strong>. This
                name is printed on the certificate and can't be changed after
                approval.
              </p>

              <label htmlFor="cert-full-name">Full Name</label>
              <input
                id="cert-full-name"
                type="text"
                autoFocus
                placeholder="e.g. Priya Sharma"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) {
                    requestCertificate(applyModal.courseId, nameInput);
                  }
                }}
                disabled={submitting}
              />

              {modalError && (
                <div className="cert-modal-error">
                  <AlertCircle size={15} />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            <div className="cert-modal-footer">
              <button
                type="button"
                className="cert-modal-cancel"
                onClick={closeApplyModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cert-modal-confirm"
                onClick={() =>
                  requestCertificate(applyModal.courseId, nameInput)
                }
                disabled={submitting || !nameInput.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="button-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit for Approval
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
