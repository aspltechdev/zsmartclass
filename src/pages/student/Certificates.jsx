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
} from "lucide-react";

import api from "../../services/api";
import "./Certificates.css";
import "./StudentShared.css";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingCourse, setRequestingCourse] = useState(null);
  const [downloadingCertificate, setDownloadingCertificate] =
    useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // ==========================================================
  // LOAD CERTIFICATES
  // ==========================================================

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setMessage({
        type: "",
        text: "",
      });

      const response = await api.get(
        "/certificates/my-certificates"
      );

      console.log(
        "My certificates:",
        response.data
      );

      if (response.data?.success) {
        setCertificates(
          Array.isArray(response.data.data)
            ? response.data.data
            : []
        );
      } else {
        setCertificates([]);
      }
    } catch (error) {
      console.error(
        "Error loading certificates:",
        error
      );

      /*
       * A student may have no certificate yet.
       * Therefore don't make the entire page unusable
       * just because the backend returns an error.
       */

      setCertificates([]);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to load certificate information.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // COURSE ID
  // ==========================================================

  const getCourseId = (certificate) => {
    return (
      certificate?.courseId ||
      certificate?.course?.id ||
      certificate?.Course?.id ||
      null
    );
  };

  // ==========================================================
  // COURSE NAME
  // ==========================================================

  const getCourseName = (certificate) => {
    return (
      certificate?.courseTitle ||
      certificate?.course?.title ||
      certificate?.Course?.title ||
      certificate?.courseName ||
      "Course"
    );
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const getStatus = (certificate) => {
    return String(
      certificate?.status || ""
    ).toUpperCase();
  };

  // ==========================================================
  // CHECK IF APPROVED
  // ==========================================================

  const isApproved = (certificate) => {
    const status = getStatus(certificate);

    return (
      status === "APPROVED" ||
      status === "ACTIVE" ||
      status === "ISSUED" ||
      status === "COMPLETED"
    );
  };

  // ==========================================================
  // CHECK IF PENDING
  // ==========================================================

  const isPending = (certificate) => {
    const status = getStatus(certificate);

    return (
      status === "PENDING" ||
      status === "REQUESTED"
    );
  };

  // ==========================================================
  // REQUEST CERTIFICATE
  // ==========================================================

  const requestCertificate = async (
    courseId
  ) => {
    if (!courseId) {
      setMessage({
        type: "error",
        text: "Course ID is missing.",
      });

      return;
    }

    try {
      setRequestingCourse(courseId);

      setMessage({
        type: "",
        text: "",
      });

      /*
       * Existing backend route:
       *
       * POST /api/certificates/generate/:courseId
       */

      const response = await api.post(
        `/certificates/generate/${courseId}`
      );

      console.log(
        "Certificate request:",
        response.data
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to request certificate."
        );
      }

      setMessage({
        type: "success",
        text:
          response.data?.message ||
          "Certificate request submitted successfully.",
      });

      /*
       * Reload certificate data.
       * If the backend creates a pending certificate,
       * it will now be reflected here.
       */

      await fetchCertificates();
    } catch (error) {
      console.error(
        "Certificate request error:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to request certificate.",
      });
    } finally {
      setRequestingCourse(null);
    }
  };

  // ==========================================================
  // DOWNLOAD CERTIFICATE
  // ==========================================================

  const downloadCertificate = async (
    certificate
  ) => {
    const certificateNo =
      certificate?.certificateNo;

    if (!certificateNo) {
      setMessage({
        type: "error",
        text:
          "Certificate number is not available.",
      });

      return;
    }

    try {
      setDownloadingCertificate(
        certificateNo
      );

      setMessage({
        type: "",
        text: "",
      });

      /*
       * Existing backend route:
       *
       * GET /api/certificates/download/:certificateNo
       */

      const response = await api.get(
        `/certificates/download/${certificateNo}`
      );

      console.log(
        "Certificate download response:",
        response.data
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to download certificate."
        );
      }

      const data =
        response.data?.data;

      /*
       * Your backend may return the PDF
       * as a Base64 value.
       */

      const pdfData =
        data?.pdf ||
        data?.pdfBuffer ||
        data?.file ||
        data?.pdfData;

      if (!pdfData) {
        throw new Error(
          "Certificate PDF is not available."
        );
      }

      let blob;

      // ------------------------------------------------------
      // BASE64 PDF
      // ------------------------------------------------------

      if (
        typeof pdfData === "string"
      ) {
        let base64 = pdfData;

        if (
          base64.includes(
            "base64,"
          )
        ) {
          base64 =
            base64.split(
              "base64,"
            )[1];
        }

        const binary =
          window.atob(base64);

        const bytes =
          new Uint8Array(
            binary.length
          );

        for (
          let i = 0;
          i < binary.length;
          i++
        ) {
          bytes[i] =
            binary.charCodeAt(i);
        }

        blob = new Blob(
          [bytes],
          {
            type: "application/pdf",
          }
        );
      }

      // ------------------------------------------------------
      // BINARY DATA
      // ------------------------------------------------------

      else {
        blob = new Blob(
          [pdfData],
          {
            type: "application/pdf",
          }
        );
      }

      // ------------------------------------------------------
      // DOWNLOAD FILE
      // ------------------------------------------------------

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        data?.filename ||
        `Certificate_${certificateNo}.pdf`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      window.URL.revokeObjectURL(
        url
      );
    } catch (error) {
      console.error(
        "Certificate download error:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to download certificate.",
      });
    } finally {
      setDownloadingCertificate(
        null
      );
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="certificates-page">

        <div className="certificates-loading">

          <div className="certificate-loader">
            <Loader2 size={32} />
          </div>

          <h3>
            Loading certificates...
          </h3>

          <p>
            Please wait while we load
            your certificate information.
          </p>

        </div>

      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="certificates-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="certificates-header">

        <div className="certificates-heading">

          <div className="certificates-heading-icon">
            <Award size={28} />
          </div>

          <div>
            <h1>
              My Certificates
            </h1>

            <p>
              Complete your courses and
              earn certificates.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="certificate-refresh-btn"
          onClick={
            fetchCertificates
          }
        >
          <RefreshCw size={17} />

          Refresh
        </button>

      </div>

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message.text && (
        <div
          className={`certificate-message ${message.type}`}
        >

          {message.type ===
          "success" ? (
            <CheckCircle size={19} />
          ) : (
            <AlertCircle size={19} />
          )}

          <span>
            {message.text}
          </span>

          <button
            type="button"
            onClick={() =>
              setMessage({
                type: "",
                text: "",
              })
            }
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================================
          CERTIFICATE SECTION
      ===================================================== */}

      <div className="certificates-section">

        <div className="certificates-section-header">

          <div>
            <h2>
              My Certificates
            </h2>

            <p>
              Certificates become available
              after completing your course.
            </p>
          </div>

          <div className="course-count">
            {certificates.length}{" "}
            {certificates.length === 1
              ? "Certificate"
              : "Certificates"}
          </div>

        </div>

        {/* ===================================================
            NO CERTIFICATES
        =================================================== */}

        {certificates.length === 0 ? (

          <div className="certificate-empty">

            <div className="certificate-empty-icon">
              <BookOpen size={40} />
            </div>

            <h3>
              No Certificates Yet
            </h3>

            <p>
              Complete your enrolled course
              to become eligible for a
              certificate.
            </p>

          </div>

        ) : (

          /* =================================================
             CERTIFICATE LIST
          ================================================= */

          <div className="certificate-list">

            {certificates.map(
              (certificate) => {

                const courseId =
                  getCourseId(
                    certificate
                  );

                const courseName =
                  getCourseName(
                    certificate
                  );

                const approved =
                  isApproved(
                    certificate
                  );

                const pending =
                  isPending(
                    certificate
                  );

                return (
                  <div
                    className="certificate-card"
                    key={
                      certificate?.id ||
                      certificate?.certificateNo ||
                      courseId
                    }
                  >

                    {/* ====================================
                        CARD HEADER
                    ==================================== */}

                    <div className="certificate-card-header">

                      <div className="certificate-course-icon">
                        <Award
                          size={24}
                        />
                      </div>

                      <div className="certificate-course-info">

                        <h3>
                          {courseName}
                        </h3>

                        {certificate?.certificateNo && (
                          <span>
                            Certificate No:{" "}
                            {
                              certificate.certificateNo
                            }
                          </span>
                        )}

                      </div>

                      {approved && (
                        <div className="certificate-approved-badge">

                          <CheckCircle
                            size={15}
                          />

                          Approved

                        </div>
                      )}

                      {pending && (
                        <div className="certificate-pending-badge">

                          <Clock
                            size={15}
                          />

                          Pending Approval

                        </div>
                      )}

                    </div>

                    {/* ====================================
                        BODY
                    ==================================== */}

                    <div className="certificate-card-body">

                      {/* ----------------------------------
                          STUDENT
                      ---------------------------------- */}

                      <div className="certificate-info-item">

                        <span>
                          Student
                        </span>

                        <strong>
                          {certificate?.studentName ||
                            certificate?.User?.name ||
                            certificate?.student?.name ||
                            "Student"}
                        </strong>

                      </div>

                      {/* ----------------------------------
                          COURSE
                      ---------------------------------- */}

                      <div className="certificate-info-item">

                        <span>
                          Course
                        </span>

                        <strong>
                          {courseName}
                        </strong>

                      </div>

                      {/* ----------------------------------
                          DATE
                      ---------------------------------- */}

                      <div className="certificate-info-item">

                        <span>
                          Issue Date
                        </span>

                        <strong>

                          {certificate?.issueDate
                            ? new Date(
                                certificate.issueDate
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "Not issued yet"}

                        </strong>

                      </div>

                    </div>

                    {/* ====================================
                        ACTIONS
                    ==================================== */}

                    <div className="certificate-card-actions">

                      {/* ----------------------------------
                          PENDING
                      ---------------------------------- */}

                      {pending && (
                        <div className="certificate-waiting">

                          <Clock
                            size={18}
                          />

                          <div>

                            <strong>
                              Waiting for Approval
                            </strong>

                            <span>
                              Your certificate request
                              has been submitted.
                            </span>

                          </div>

                        </div>
                      )}

                      {/* ----------------------------------
                          APPROVED
                      ---------------------------------- */}

                      {approved && (
                        <button
                          type="button"
                          className="download-certificate-btn"
                          onClick={() =>
                            downloadCertificate(
                              certificate
                            )
                          }
                          disabled={
                            downloadingCertificate ===
                            certificate?.certificateNo
                          }
                        >

                          {downloadingCertificate ===
                          certificate?.certificateNo ? (
                            <>
                              <Loader2
                                size={17}
                                className="button-spinner"
                              />

                              Preparing...
                            </>
                          ) : (
                            <>
                              <Download
                                size={17}
                              />

                              Download Certificate
                            </>
                          )}

                        </button>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default Certificates;