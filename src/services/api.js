// // import axios from "axios";

// // const api = axios.create({
// //   baseURL: "http://localhost:5000/api"
// // });

// // export default api;


// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;


// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;



// import axios from "axios";
// import { useAuth } from "../context/AuthContext";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   timeout: 10000,
// });

// // Request Interceptor
// api.interceptors.request.use(
//   (config) => {
//     // Try to get token from multiple sources
//     const token = 
//       localStorage.getItem("token") || 
//       sessionStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response Interceptor
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Clear storage
//       ["token", "user", "rememberMe"].forEach(key => {
//         localStorage.removeItem(key);
//         sessionStorage.removeItem(key);
//       });
      
//       // Redirect to login
//       if (window.location.pathname !== "/login") {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor - Get fresh token each time
api.interceptors.request.use(
  (config) => {
    // Always get the latest token from storage
    const token = 
      sessionStorage.getItem("token") || 
      localStorage.getItem("token");

    console.log("API Request - Token found:", !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token available for request to:", config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error("401 Unauthorized - Clearing auth data");
      
      // Clear all auth data
      ["token", "user", "rememberMe"].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;