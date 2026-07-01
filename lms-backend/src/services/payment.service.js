// // // src/services/payment.service.js
// // const prisma = require("../config/prisma");
// // const crypto = require("crypto");
// // const razorpay = require("../config/razorpay");

// // class PaymentService {
// //   /**
// //    * Create Razorpay Order
// //    */
// //   async createOrder(studentId, body) {
// //     const { courseId } = body;

// //     if (!courseId) {
// //       const error = new Error("Course ID is required");
// //       error.statusCode = 400;
// //       throw error;
// //     }

// //     // Get course details
// //     const course = await prisma.course.findUnique({
// //       where: { id: courseId },
// //       select: {
// //         id: true,
// //         title: true,
// //         price: true,
// //         status: true,
// //         createdById: true
// //       }
// //     });

// //     if (!course) {
// //       const error = new Error("Course not found");
// //       error.statusCode = 404;
// //       throw error;
// //     }

// //     if (course.status !== "Published") {
// //       const error = new Error("Course is not available for purchase");
// //       error.statusCode = 400;
// //       throw error;
// //     }

// //     // Prevent self-enrollment
// //     if (course.createdById === studentId) {
// //       const error = new Error("You cannot purchase your own course");
// //       error.statusCode = 400;
// //       throw error;
// //     }

// //     // Check if already enrolled
// //     const existingEnrollment = await prisma.enrollment.findFirst({
// //       where: {
// //         studentId,
// //         courseId
// //       }
// //     });

// //     if (existingEnrollment) {
// //       const error = new Error("You are already enrolled in this course");
// //       error.statusCode = 400;
// //       throw error;
// //     }

// //     // Check for pending payment
// //     const pendingPayment = await prisma.payment.findFirst({
// //       where: {
// //         studentId,
// //         courseId,
// //         status: "PENDING"
// //       }
// //     });

// //     if (pendingPayment) {
// //       // Return existing order if not expired (30 min expiry)
// //       const orderAge = Date.now() - new Date(pendingPayment.createdAt).getTime();
// //       if (orderAge < 30 * 60 * 1000) {
// //         return {
// //           orderId: pendingPayment.orderId,
// //           amount: pendingPayment.amount,
// //           currency: pendingPayment.currency,
// //           course: {
// //             id: course.id,
// //             title: course.title,
// //             price: course.price
// //           }
// //         };
// //       }
      
// //       // Expire old pending payment
// //       await prisma.payment.update({
// //         where: { id: pendingPayment.id },
// //         data: { status: "FAILED" }
// //       });
// //     }

// //     // Create Razorpay order
// //     const amountInPaise = Math.round(course.price * 100); // Convert to paise
    
// //     const order = await razorpay.orders.create({
// //       amount: amountInPaise,
// //       currency: "INR",
// //       receipt: `receipt_${Date.now()}_${studentId}`,
// //       notes: {
// //         courseId: course.id,
// //         studentId: studentId,
// //         courseTitle: course.title
// //       }
// //     });

// //     // Save payment record
// //     await prisma.payment.create({
// //       data: {
// //         studentId,
// //         courseId,
// //         orderId: order.id,
// //         amount: course.price,
// //         currency: order.currency,
// //         status: "PENDING"
// //       }
// //     });

// //     return {
// //       orderId: order.id,
// //       amount: course.price,
// //       currency: order.currency,
// //       course: {
// //         id: course.id,
// //         title: course.title,
// //         price: course.price
// //       },
// //       key: process.env.RAZORPAY_KEY_ID
// //     };
// //   }

// //   /**
// //    * Verify Payment Signature
// //    */
// //   async verifyPayment(studentId, body) {
// //     const {
// //       razorpay_order_id,
// //       razorpay_payment_id,
// //       razorpay_signature
// //     } = body;

// //     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
// //       const error = new Error("Missing payment verification details");
// //       error.statusCode = 400;
// //       throw error;
// //     }

// //     // Find the payment record
// //     const payment = await prisma.payment.findFirst({
// //       where: {
// //         orderId: razorpay_order_id,
// //         studentId
// //       },
// //       include: {
// //         course: {
// //           select: {
// //             id: true,
// //             title: true,
// //             price: true
// //           }
// //         }
// //       }
// //     });

// //     if (!payment) {
// //       const error = new Error("Payment record not found");
// //       error.statusCode = 404;
// //       throw error;
// //     }

// //     if (payment.status === "COMPLETED") {
// //       const enrollment = await prisma.enrollment.findFirst({
// //         where: {
// //           studentId,
// //           courseId: payment.courseId
// //         }
// //       });

// //       return {
// //         success: true,
// //         message: "Payment already verified",
// //         payment: {
// //           id: payment.id,
// //           amount: payment.amount,
// //           status: payment.status
// //         },
// //         enrollment
// //       };
// //     }

// //     // Verify signature
// //     const generatedSignature = crypto
// //       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
// //       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
// //       .digest("hex");

// //     if (generatedSignature !== razorpay_signature) {
// //       // Update payment as failed
// //       await prisma.payment.update({
// //         where: { id: payment.id },
// //         data: {
// //           status: "FAILED",
// //           paymentId: razorpay_payment_id,
// //           signature: razorpay_signature
// //         }
// //       });

// //       const error = new Error("Payment verification failed. Invalid signature.");
// //       error.statusCode = 400;
// //       throw error;
// //     }

// //     // Use transaction for payment update and enrollment
// //     const result = await prisma.$transaction(async (tx) => {
// //       // Update payment status
// //       const updatedPayment = await tx.payment.update({
// //         where: { id: payment.id },
// //         data: {
// //           paymentId: razorpay_payment_id,
// //           signature: razorpay_signature,
// //           status: "COMPLETED"
// //         }
// //       });

// //       // Check if already enrolled (safety check)
// //       const existingEnrollment = await tx.enrollment.findFirst({
// //         where: {
// //           studentId,
// //           courseId: payment.courseId
// //         }
// //       });

// //       if (existingEnrollment) {
// //         return {
// //           payment: updatedPayment,
// //           enrollment: existingEnrollment,
// //           alreadyEnrolled: true
// //         };
// //       }

// //       // Create enrollment
// //       const enrollment = await tx.enrollment.create({
// //         data: {
// //           studentId,
// //           courseId: payment.courseId,
// //           progress: 0,
// //           completed: false
// //         }
// //       });

// //       return {
// //         payment: updatedPayment,
// //         enrollment,
// //         alreadyEnrolled: false
// //       };
// //     });

// //     return {
// //       success: true,
// //       message: result.alreadyEnrolled 
// //         ? "Payment verified. You were already enrolled." 
// //         : "Payment successful. You are now enrolled.",
// //       payment: {
// //         id: result.payment.id,
// //         orderId: result.payment.orderId,
// //         paymentId: result.payment.paymentId,
// //         amount: result.payment.amount,
// //         currency: result.payment.currency,
// //         status: result.payment.status
// //       },
// //       enrollment: {
// //         id: result.enrollment.id,
// //         courseId: result.enrollment.courseId,
// //         progress: result.enrollment.progress,
// //         completed: result.enrollment.completed
// //       },
// //       course: {
// //         id: payment.course.id,
// //         title: payment.course.title,
// //         price: payment.course.price
// //       }
// //     };
// //   }

// //   /**
// //    * Payment History
// //    */
// //   async paymentHistory(studentId) {
// //     const payments = await prisma.payment.findMany({
// //       where: { studentId },
// //       orderBy: { createdAt: "desc" },
// //       include: {
// //         course: {
// //           select: {
// //             id: true,
// //             title: true,
// //             thumbnail: true,
// //             price: true
// //           }
// //         }
// //       }
// //     });

// //     return payments.map(payment => ({
// //       id: payment.id,
// //       orderId: payment.orderId,
// //       paymentId: payment.paymentId,
// //       amount: payment.amount,
// //       currency: payment.currency,
// //       status: payment.status,
// //       signature: payment.signature,
// //       course: payment.course,
// //       createdAt: payment.createdAt,
// //       updatedAt: payment.updatedAt
// //     }));
// //   }

// //   /**
// //    * Get Payment Details
// //    */
// //   async getPayment(studentId, paymentId) {
// //     const payment = await prisma.payment.findFirst({
// //       where: {
// //         id: paymentId,
// //         studentId
// //       },
// //       include: {
// //         course: {
// //           select: {
// //             id: true,
// //             title: true,
// //             thumbnail: true,
// //             price: true,
// //             createdBy: {
// //               select: {
// //                 id: true,
// //                 name: true
// //               }
// //             }
// //           }
// //         }
// //       }
// //     });

// //     if (!payment) {
// //       const error = new Error("Payment not found");
// //       error.statusCode = 404;
// //       throw error;
// //     }

// //     return {
// //       id: payment.id,
// //       orderId: payment.orderId,
// //       paymentId: payment.paymentId,
// //       amount: payment.amount,
// //       currency: payment.currency,
// //       status: payment.status,
// //       signature: payment.signature,
// //       course: payment.course,
// //       createdAt: payment.createdAt,
// //       updatedAt: payment.updatedAt
// //     };
// //   }

// //   /**
// //    * My Purchased Courses
// //    */
// //   async myPurchasedCourses(studentId) {
// //     const enrollments = await prisma.enrollment.findMany({
// //       where: { studentId },
// //       orderBy: { createdAt: "desc" },
// //       include: {
// //         course: {
// //           select: {
// //             id: true,
// //             title: true,
// //             thumbnail: true,
// //             description: true,
// //             price: true,
// //             level: true,
// //             category: true,
// //             duration: true,
// //             createdBy: {
// //               select: {
// //                 id: true,
// //                 name: true,
// //                 avatar: true
// //               }
// //             }
// //           }
// //         }
// //       }
// //     });

// //     // Fetch payment details separately for each course
// //     const coursesWithDetails = await Promise.all(
// //       enrollments.map(async (enrollment) => {
// //         const latestPayment = await prisma.payment.findFirst({
// //           where: {
// //             studentId,
// //             courseId: enrollment.courseId,
// //             status: "COMPLETED"
// //           },
// //           orderBy: { createdAt: "desc" },
// //           select: {
// //             id: true,
// //             orderId: true,
// //             paymentId: true,
// //             amount: true,
// //             currency: true,
// //             status: true,
// //             createdAt: true
// //           }
// //         });

// //         return {
// //           enrollment: {
// //             id: enrollment.id,
// //             progress: enrollment.progress,
// //             completed: enrollment.completed,
// //             enrolledAt: enrollment.createdAt
// //           },
// //           course: enrollment.course,
// //           payment: latestPayment || null
// //         };
// //       })
// //     );

// //     return {
// //       totalCourses: coursesWithDetails.length,
// //       courses: coursesWithDetails
// //     };
// //   }
// // }

// // module.exports = new PaymentService();

// // src/services/payment.service.js
// const prisma = require("../config/prisma");
// const crypto = require("crypto");
// const razorpay = require("../config/razorpay");

// class PaymentService {
//   /**
//    * Create Razorpay Order
//    */
//   async createOrder(studentId, body) {
//     const { courseId } = body;

//     if (!courseId) {
//       const error = new Error("Course ID is required");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Get course details
//     const course = await prisma.course.findUnique({
//       where: { id: courseId },
//       select: {
//         id: true,
//         title: true,
//         price: true,
//         status: true,
//         createdById: true
//       }
//     });

//     if (!course) {
//       const error = new Error("Course not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     if (course.status !== "Published") {
//       const error = new Error("Course is not available for purchase");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Prevent self-enrollment
//     if (course.createdById === studentId) {
//       const error = new Error("You cannot purchase your own course");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Check if already enrolled
//     const existingEnrollment = await prisma.enrollment.findFirst({
//       where: {
//         studentId,
//         courseId
//       }
//     });

//     if (existingEnrollment) {
//       const error = new Error("You are already enrolled in this course");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Check for pending payment
//     const pendingPayment = await prisma.payment.findFirst({
//       where: {
//         studentId,
//         courseId,
//         status: "PENDING"
//       }
//     });

//     if (pendingPayment) {
//       // Return existing order if not expired (30 min expiry)
//       const orderAge = Date.now() - new Date(pendingPayment.createdAt).getTime();
//       if (orderAge < 30 * 60 * 1000) {
//         return {
//           orderId: pendingPayment.orderId,
//           amount: pendingPayment.amount,
//           currency: pendingPayment.currency,
//           course: {
//             id: course.id,
//             title: course.title,
//             price: course.price
//           }
//         };
//       }
      
//       // Expire old pending payment
//       await prisma.payment.update({
//         where: { id: pendingPayment.id },
//         data: { status: "FAILED" }
//       });
//     }

//     // Create Razorpay order
//     const amountInPaise = Math.round(course.price * 100); // Convert to paise
    
//     const order = await razorpay.orders.create({
//       amount: amountInPaise,
//       currency: "INR",
//       receipt: `receipt_${Date.now()}_${studentId}`,
//       notes: {
//         courseId: course.id,
//         studentId: studentId,
//         courseTitle: course.title
//       }
//     });

//     // Save payment record
//     await prisma.payment.create({
//       data: {
//         studentId,
//         courseId,
//         orderId: order.id,
//         amount: course.price,
//         currency: order.currency,
//         status: "PENDING"
//       }
//     });

//     return {
//       orderId: order.id,
//       amount: course.price,
//       currency: order.currency,
//       course: {
//         id: course.id,
//         title: course.title,
//         price: course.price
//       },
//       key: process.env.RAZORPAY_KEY_ID
//     };
//   }

//   /**
//    * Verify Payment Signature
//    */
//   async verifyPayment(studentId, body) {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature
//     } = body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       const error = new Error("Missing payment verification details");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Find the payment record
//     const payment = await prisma.payment.findFirst({
//       where: {
//         orderId: razorpay_order_id,
//         studentId
//       },
//       include: {
//         course: {
//           select: {
//             id: true,
//             title: true,
//             price: true
//           }
//         }
//       }
//     });

//     if (!payment) {
//       const error = new Error("Payment record not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     if (payment.status === "COMPLETED") {
//       const enrollment = await prisma.enrollment.findFirst({
//         where: {
//           studentId,
//           courseId: payment.courseId
//         }
//       });

//       return {
//         success: true,
//         message: "Payment already verified",
//         payment: {
//           id: payment.id,
//           amount: payment.amount,
//           status: payment.status
//         },
//         enrollment
//       };
//     }

//     // Verify signature
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       // Update payment as failed
//       await prisma.payment.update({
//         where: { id: payment.id },
//         data: {
//           status: "FAILED",
//           paymentId: razorpay_payment_id,
//           signature: razorpay_signature
//         }
//       });

//       const error = new Error("Payment verification failed. Invalid signature.");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Use transaction for payment update, enrollment, and notification
//     const result = await prisma.$transaction(async (tx) => {
//       // Update payment status
//       const updatedPayment = await tx.payment.update({
//         where: { id: payment.id },
//         data: {
//           paymentId: razorpay_payment_id,
//           signature: razorpay_signature,
//           status: "COMPLETED"
//         }
//       });

//       // Check if already enrolled (safety check)
//       const existingEnrollment = await tx.enrollment.findFirst({
//         where: {
//           studentId,
//           courseId: payment.courseId
//         }
//       });

//       if (existingEnrollment) {
//         return {
//           payment: updatedPayment,
//           enrollment: existingEnrollment,
//           alreadyEnrolled: true
//         };
//       }

//       // Create enrollment
//       const enrollment = await tx.enrollment.create({
//         data: {
//           studentId,
//           courseId: payment.courseId,
//           progress: 0,
//           completed: false
//         }
//       });

//       // Create notification for successful payment
//       await tx.notification.create({
//         data: {
//           studentId,
//           title: "Payment Successful",
//           message: `You have successfully enrolled in ${payment.course.title}.`,
//           type: "PAYMENT"
//         }
//       });

//       // Create notification for course instructor
//       const course = await tx.course.findUnique({
//         where: { id: payment.courseId },
//         select: { createdById: true, title: true }
//       });

//       if (course) {
//         await tx.notification.create({
//           data: {
//             studentId: course.createdById,
//             title: "New Enrollment",
//             message: `A student has enrolled in your course "${course.title}".`,
//             type: "ENROLLMENT"
//           }
//         });
//       }

//       return {
//         payment: updatedPayment,
//         enrollment,
//         alreadyEnrolled: false
//       };
//     });

//     return {
//       success: true,
//       message: result.alreadyEnrolled 
//         ? "Payment verified. You were already enrolled." 
//         : "Payment successful. You are now enrolled.",
//       payment: {
//         id: result.payment.id,
//         orderId: result.payment.orderId,
//         paymentId: result.payment.paymentId,
//         amount: result.payment.amount,
//         currency: result.payment.currency,
//         status: result.payment.status
//       },
//       enrollment: {
//         id: result.enrollment.id,
//         courseId: result.enrollment.courseId,
//         progress: result.enrollment.progress,
//         completed: result.enrollment.completed
//       },
//       course: {
//         id: payment.course.id,
//         title: payment.course.title,
//         price: payment.course.price
//       }
//     };
//   }

//   /**
//    * Payment History
//    */
//   async paymentHistory(studentId) {
//     const payments = await prisma.payment.findMany({
//       where: { studentId },
//       orderBy: { createdAt: "desc" },
//       include: {
//         course: {
//           select: {
//             id: true,
//             title: true,
//             thumbnail: true,
//             price: true
//           }
//         }
//       }
//     });

//     return payments.map(payment => ({
//       id: payment.id,
//       orderId: payment.orderId,
//       paymentId: payment.paymentId,
//       amount: payment.amount,
//       currency: payment.currency,
//       status: payment.status,
//       signature: payment.signature,
//       course: payment.course,
//       createdAt: payment.createdAt,
//       updatedAt: payment.updatedAt
//     }));
//   }

//   /**
//    * Get Payment Details
//    */
//   async getPayment(studentId, paymentId) {
//     const payment = await prisma.payment.findFirst({
//       where: {
//         id: paymentId,
//         studentId
//       },
//       include: {
//         course: {
//           select: {
//             id: true,
//             title: true,
//             thumbnail: true,
//             price: true,
//             createdBy: {
//               select: {
//                 id: true,
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!payment) {
//       const error = new Error("Payment not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     return {
//       id: payment.id,
//       orderId: payment.orderId,
//       paymentId: payment.paymentId,
//       amount: payment.amount,
//       currency: payment.currency,
//       status: payment.status,
//       signature: payment.signature,
//       course: payment.course,
//       createdAt: payment.createdAt,
//       updatedAt: payment.updatedAt
//     };
//   }

//   /**
//    * My Purchased Courses
//    */
//   async myPurchasedCourses(studentId) {
//     const enrollments = await prisma.enrollment.findMany({
//       where: { studentId },
//       orderBy: { createdAt: "desc" },
//       include: {
//         course: {
//           select: {
//             id: true,
//             title: true,
//             thumbnail: true,
//             description: true,
//             price: true,
//             level: true,
//             category: true,
//             duration: true,
//             createdBy: {
//               select: {
//                 id: true,
//                 name: true,
//                 avatar: true
//               }
//             }
//           }
//         }
//       }
//     });

//     // Fetch payment details separately for each course
//     const coursesWithDetails = await Promise.all(
//       enrollments.map(async (enrollment) => {
//         const latestPayment = await prisma.payment.findFirst({
//           where: {
//             studentId,
//             courseId: enrollment.courseId,
//             status: "COMPLETED"
//           },
//           orderBy: { createdAt: "desc" },
//           select: {
//             id: true,
//             orderId: true,
//             paymentId: true,
//             amount: true,
//             currency: true,
//             status: true,
//             createdAt: true
//           }
//         });

//         return {
//           enrollment: {
//             id: enrollment.id,
//             progress: enrollment.progress,
//             completed: enrollment.completed,
//             enrolledAt: enrollment.createdAt
//           },
//           course: enrollment.course,
//           payment: latestPayment || null
//         };
//       })
//     );

//     return {
//       totalCourses: coursesWithDetails.length,
//       courses: coursesWithDetails
//     };
//   }
// }

// module.exports = new PaymentService();

// src/services/payment.service.js
const prisma = require("../config/prisma");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const emailService = require("./email.service");

class PaymentService {
  /**
   * Create Razorpay Order
   */
  async createOrder(studentId, body) {
    const { courseId } = body;

    if (!courseId) {
      const error = new Error("Course ID is required");
      error.statusCode = 400;
      throw error;
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        createdById: true
      }
    });

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    if (course.status !== "Published") {
      const error = new Error("Course is not available for purchase");
      error.statusCode = 400;
      throw error;
    }

    // Prevent self-enrollment
    if (course.createdById === studentId) {
      const error = new Error("You cannot purchase your own course");
      error.statusCode = 400;
      throw error;
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId
      }
    });

    if (existingEnrollment) {
      const error = new Error("You are already enrolled in this course");
      error.statusCode = 400;
      throw error;
    }

    // Check for pending payment
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        studentId,
        courseId,
        status: "PENDING"
      }
    });

    if (pendingPayment) {
      // Return existing order if not expired (30 min expiry)
      const orderAge = Date.now() - new Date(pendingPayment.createdAt).getTime();
      if (orderAge < 30 * 60 * 1000) {
        return {
          orderId: pendingPayment.orderId,
          amount: pendingPayment.amount,
          currency: pendingPayment.currency,
          course: {
            id: course.id,
            title: course.title,
            price: course.price
          }
        };
      }
      
      // Expire old pending payment
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: { status: "FAILED" }
      });
    }

    // Create Razorpay order
    const amountInPaise = Math.round(course.price * 100); // Convert to paise
    
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}_${studentId}`,
      notes: {
        courseId: course.id,
        studentId: studentId,
        courseTitle: course.title
      }
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        studentId,
        courseId,
        orderId: order.id,
        amount: course.price,
        currency: order.currency,
        status: "PENDING"
      }
    });

    return {
      orderId: order.id,
      amount: course.price,
      currency: order.currency,
      course: {
        id: course.id,
        title: course.title,
        price: course.price
      },
      key: process.env.RAZORPAY_KEY_ID
    };
  }

  /**
   * Verify Payment Signature
   */
  async verifyPayment(studentId, body) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const error = new Error("Missing payment verification details");
      error.statusCode = 400;
      throw error;
    }

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: razorpay_order_id,
        studentId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true
          }
        },
        student: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!payment) {
      const error = new Error("Payment record not found");
      error.statusCode = 404;
      throw error;
    }

    if (payment.status === "COMPLETED") {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          courseId: payment.courseId
        }
      });

      return {
        success: true,
        message: "Payment already verified",
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status
        },
        enrollment
      };
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Update payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          paymentId: razorpay_payment_id,
          signature: razorpay_signature
        }
      });

      const error = new Error("Payment verification failed. Invalid signature.");
      error.statusCode = 400;
      throw error;
    }

    // Use transaction for payment update, enrollment, and notification
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "COMPLETED"
        }
      });

      // Check if already enrolled (safety check)
      const existingEnrollment = await tx.enrollment.findFirst({
        where: {
          studentId,
          courseId: payment.courseId
        }
      });

      if (existingEnrollment) {
        return {
          payment: updatedPayment,
          enrollment: existingEnrollment,
          alreadyEnrolled: true
        };
      }

      // Create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          courseId: payment.courseId,
          progress: 0,
          completed: false
        }
      });

      // Create notification for successful payment
      await tx.notification.create({
        data: {
          studentId,
          title: "Payment Successful",
          message: `You have successfully enrolled in ${payment.course.title}.`,
          type: "PAYMENT"
        }
      });

      // Create notification for course instructor
      const course = await tx.course.findUnique({
        where: { id: payment.courseId },
        select: { createdById: true, title: true }
      });

      if (course) {
        await tx.notification.create({
          data: {
            studentId: course.createdById,
            title: "New Enrollment",
            message: `A student has enrolled in your course "${course.title}".`,
            type: "ENROLLMENT"
          }
        });
      }

      return {
        payment: updatedPayment,
        enrollment,
        alreadyEnrolled: false
      };
    });

    // Send emails outside transaction (non-critical operations)
    try {
      if (!result.alreadyEnrolled && payment.student) {
        // Send payment success email
        await emailService.sendPaymentSuccess(
          payment.student.email,
          payment.student.name,
          payment.course.title,
          payment.amount
        );

        // Send welcome course email
        await emailService.sendWelcomeCourse(
          payment.student.email,
          payment.student.name,
          payment.course.title
        );
      }
    } catch (emailError) {
      // Log email error but don't fail the payment verification
      console.error("Failed to send payment confirmation emails:", emailError.message);
    }

    return {
      success: true,
      message: result.alreadyEnrolled 
        ? "Payment verified. You were already enrolled." 
        : "Payment successful. You are now enrolled.",
      payment: {
        id: result.payment.id,
        orderId: result.payment.orderId,
        paymentId: result.payment.paymentId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        status: result.payment.status
      },
      enrollment: {
        id: result.enrollment.id,
        courseId: result.enrollment.courseId,
        progress: result.enrollment.progress,
        completed: result.enrollment.completed
      },
      course: {
        id: payment.course.id,
        title: payment.course.title,
        price: payment.course.price
      }
    };
  }

  /**
   * Payment History
   */
  async paymentHistory(studentId) {
    const payments = await prisma.payment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true
          }
        }
      }
    });

    return payments.map(payment => ({
      id: payment.id,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      signature: payment.signature,
      course: payment.course,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }));
  }

  /**
   * Get Payment Details
   */
  async getPayment(studentId, paymentId) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        studentId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      signature: payment.signature,
      course: payment.course,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }

  /**
   * My Purchased Courses
   */
  async myPurchasedCourses(studentId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            description: true,
            price: true,
            level: true,
            category: true,
            duration: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Fetch payment details separately for each course
    const coursesWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const latestPayment = await prisma.payment.findFirst({
          where: {
            studentId,
            courseId: enrollment.courseId,
            status: "COMPLETED"
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderId: true,
            paymentId: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true
          }
        });

        return {
          enrollment: {
            id: enrollment.id,
            progress: enrollment.progress,
            completed: enrollment.completed,
            enrolledAt: enrollment.createdAt
          },
          course: enrollment.course,
          payment: latestPayment || null
        };
      })
    );

    return {
      totalCourses: coursesWithDetails.length,
      courses: coursesWithDetails
    };
  }
}

module.exports = new PaymentService();