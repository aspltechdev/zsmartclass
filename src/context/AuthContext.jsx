// // // // import { createContext, useContext, useState } from "react";

// // // // const AuthContext = createContext();

// // // // export const AuthProvider = ({ children }) => {
// // // //   const [user, setUser] = useState(
// // // //     JSON.parse(localStorage.getItem("user")) || null
// // // //   );

// // // //   const login = (data) => {
// // // //     localStorage.setItem("token", data.token);
// // // //     localStorage.setItem("user", JSON.stringify(data.user));
// // // //     setUser(data.user);
// // // //   };

// // // //   const logout = () => {
// // // //     localStorage.clear();
// // // //     setUser(null);
// // // //   };

// // // //   return (
// // // //     <AuthContext.Provider
// // // //       value={{
// // // //         user,
// // // //         login,
// // // //         logout
// // // //       }}
// // // //     >
// // // //       {children}
// // // //     </AuthContext.Provider>
// // // //   );
// // // // };

// // // // export const useAuth = () => useContext(AuthContext);

// // // // import { createContext, useContext, useEffect, useState } from "react";

// // // // const AuthContext = createContext();

// // // // export const AuthProvider = ({ children }) => {
// // // //   const [user, setUser] = useState(null);
// // // //   const [token, setToken] = useState(null);

// // // //   useEffect(() => {
// // // //     const storedUser = localStorage.getItem("user");
// // // //     const storedToken = localStorage.getItem("token");

// // // //     if (storedUser && storedToken) {
// // // //       setUser(JSON.parse(storedUser));
// // // //       setToken(storedToken);
// // // //     }
// // // //   }, []);

// // // //   const login = (data) => {
// // // //     localStorage.setItem("token", data.token);
// // // //     localStorage.setItem("user", JSON.stringify(data.user));

// // // //     setToken(data.token);
// // // //     setUser(data.user);
// // // //   };

// // // //   const logout = () => {
// // // //     localStorage.removeItem("token");
// // // //     localStorage.removeItem("user");

// // // //     setToken(null);
// // // //     setUser(null);
// // // //   };

// // // //   return (
// // // //     <AuthContext.Provider
// // // //       value={{
// // // //         user,
// // // //         token,
// // // //         login,
// // // //         logout,
// // // //         isAuthenticated: !!token,
// // // //       }}
// // // //     >
// // // //       {children}
// // // //     </AuthContext.Provider>
// // // //   );
// // // // };

// // // // export const useAuth = () => useContext(AuthContext);

// // // // src/context/AuthContext.jsx



// // // // import { createContext, useContext, useEffect, useState } from "react";

// // // // const AuthContext = createContext();

// // // // export const AuthProvider = ({ children }) => {
// // // //   const [user, setUser] = useState(null);
// // // //   const [token, setToken] = useState(null);
// // // //   const [loading, setLoading] = useState(true);

// // // //   useEffect(() => {
// // // //     // Check localStorage first, then sessionStorage
// // // //     const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
// // // //     const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");

// // // //     if (storedUser && storedToken) {
// // // //       try {
// // // //         setUser(JSON.parse(storedUser));
// // // //         setToken(storedToken);
// // // //       } catch (err) {
// // // //         console.error("Failed to parse user data:", err);
// // // //         // Clear invalid data
// // // //         localStorage.removeItem("token");
// // // //         localStorage.removeItem("user");
// // // //         sessionStorage.removeItem("token");
// // // //         sessionStorage.removeItem("user");
// // // //       }
// // // //     }
    
// // // //     setLoading(false);
// // // //   }, []);

// // // //   const login = (data, rememberMe = false) => {
// // // //     const { token: authToken, user: userData } = data;

// // // //     if (rememberMe) {
// // // //       // Store in localStorage for persistent login
// // // //       localStorage.setItem("token", authToken);
// // // //       localStorage.setItem("user", JSON.stringify(userData));
// // // //     } else {
// // // //       // Store in sessionStorage for session-only login
// // // //       sessionStorage.setItem("token", authToken);
// // // //       sessionStorage.setItem("user", JSON.stringify(userData));
// // // //     }

// // // //     setToken(authToken);
// // // //     setUser(userData);
// // // //   };

// // // //   const logout = () => {
// // // //     // Clear all storage
// // // //     localStorage.removeItem("token");
// // // //     localStorage.removeItem("user");
// // // //     sessionStorage.removeItem("token");
// // // //     sessionStorage.removeItem("user");

// // // //     setToken(null);
// // // //     setUser(null);
// // // //   };

// // // //   const updateUser = (userData) => {
// // // //     const updatedUser = { ...user, ...userData };
// // // //     setUser(updatedUser);

// // // //     // Update in whichever storage is being used
// // // //     if (localStorage.getItem("user")) {
// // // //       localStorage.setItem("user", JSON.stringify(updatedUser));
// // // //     } else if (sessionStorage.getItem("user")) {
// // // //       sessionStorage.setItem("user", JSON.stringify(updatedUser));
// // // //     }
// // // //   };

// // // //   return (
// // // //     <AuthContext.Provider
// // // //       value={{
// // // //         user,
// // // //         token,
// // // //         login,
// // // //         logout,
// // // //         updateUser,
// // // //         isAuthenticated: !!token && !!user,
// // // //         loading,
// // // //         isAdmin: user?.role === "ADMIN",
// // // //         isMentor: user?.role === "MENTOR",
// // // //         isStudent: user?.role === "STUDENT",
// // // //       }}
// // // //     >
// // // //       {children}
// // // //     </AuthContext.Provider>
// // // //   );
// // // // };

// // // // export const useAuth = () => {
// // // //   const context = useContext(AuthContext);
// // // //   if (!context) {
// // // //     throw new Error("useAuth must be used within AuthProvider");
// // // //   }
// // // //   return context;
// // // // };

// // // // src/context/AuthContext.jsx
// // // import { createContext, useContext, useEffect, useState } from "react";

// // // const AuthContext = createContext();

// // // export const AuthProvider = ({ children }) => {
// // //   const [user, setUser] = useState(null);
// // //   const [token, setToken] = useState(null);
// // //   const [loading, setLoading] = useState(true);

// // //   useEffect(() => {
// // //     // Clear any invalid data first
// // //     clearInvalidStorage();
    
// // //     // Check localStorage first, then sessionStorage
// // //     const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
// // //     const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");

// // //     if (storedUser && storedToken) {
// // //       try {
// // //         const parsedUser = JSON.parse(storedUser);
        
// // //         // Validate that parsed user has required fields
// // //         if (parsedUser && parsedUser.id && parsedUser.role) {
// // //           setUser(parsedUser);
// // //           setToken(storedToken);
// // //         } else {
// // //           // Invalid user object - clear storage
// // //           clearAllStorage();
// // //         }
// // //       } catch (err) {
// // //         console.error("Failed to parse user data:", err);
// // //         // Clear invalid data
// // //         clearAllStorage();
// // //       }
// // //     }
    
// // //     setLoading(false);
// // //   }, []);

// // //   const clearInvalidStorage = () => {
// // //     try {
// // //       // Check localStorage
// // //       const localUser = localStorage.getItem("user");
// // //       if (localUser && localUser !== "undefined") {
// // //         try {
// // //           JSON.parse(localUser);
// // //         } catch {
// // //           localStorage.removeItem("user");
// // //           localStorage.removeItem("token");
// // //         }
// // //       } else if (localUser === "undefined") {
// // //         localStorage.removeItem("user");
// // //         localStorage.removeItem("token");
// // //       }

// // //       // Check sessionStorage
// // //       const sessionUser = sessionStorage.getItem("user");
// // //       if (sessionUser && sessionUser !== "undefined") {
// // //         try {
// // //           JSON.parse(sessionUser);
// // //         } catch {
// // //           sessionStorage.removeItem("user");
// // //           sessionStorage.removeItem("token");
// // //         }
// // //       } else if (sessionUser === "undefined") {
// // //         sessionStorage.removeItem("user");
// // //         sessionStorage.removeItem("token");
// // //       }
// // //     } catch (err) {
// // //       console.error("Error clearing storage:", err);
// // //     }
// // //   };

// // //   const clearAllStorage = () => {
// // //     localStorage.removeItem("token");
// // //     localStorage.removeItem("user");
// // //     sessionStorage.removeItem("token");
// // //     sessionStorage.removeItem("user");
// // //   };

// // //   const login = (data, rememberMe = false) => {
// // //     // Support both { token, user } and { token: authToken, user: userData }
// // //     const authToken = data.token;
// // //     const userData = data.user;

// // //     if (!authToken || !userData) {
// // //       console.error("Invalid login data:", data);
// // //       return;
// // //     }

// // //     // Store user data as JSON string
// // //     const userString = JSON.stringify(userData);

// // //     if (rememberMe) {
// // //       // Store in localStorage for persistent login
// // //       localStorage.setItem("token", authToken);
// // //       localStorage.setItem("user", userString);
// // //     } else {
// // //       // Store in sessionStorage for session-only login
// // //       sessionStorage.setItem("token", authToken);
// // //       sessionStorage.setItem("user", userString);
// // //     }

// // //     setToken(authToken);
// // //     setUser(userData);
// // //   };

// // //   const logout = () => {
// // //     clearAllStorage();
// // //     setToken(null);
// // //     setUser(null);
// // //   };

// // //   const updateUser = (userData) => {
// // //     const updatedUser = { ...user, ...userData };
// // //     setUser(updatedUser);

// // //     const userString = JSON.stringify(updatedUser);

// // //     // Update in whichever storage is being used
// // //     if (localStorage.getItem("user")) {
// // //       localStorage.setItem("user", userString);
// // //     } else if (sessionStorage.getItem("user")) {
// // //       sessionStorage.setItem("user", userString);
// // //     }
// // //   };

// // //   return (
// // //     <AuthContext.Provider
// // //       value={{
// // //         user,
// // //         token,
// // //         login,
// // //         logout,
// // //         updateUser,
// // //         isAuthenticated: !!token && !!user,
// // //         loading,
// // //         isAdmin: user?.role === "ADMIN",
// // //         isMentor: user?.role === "MENTOR",
// // //         isStudent: user?.role === "STUDENT",
// // //       }}
// // //     >
// // //       {!loading && children}
// // //     </AuthContext.Provider>
// // //   );
// // // };

// // // export const useAuth = () => {
// // //   const context = useContext(AuthContext);
// // //   if (!context) {
// // //     throw new Error("useAuth must be used within AuthProvider");
// // //   }
// // //   return context;
// // // };


// // // src/context/AuthContext.jsx
// // import { createContext, useContext, useEffect, useState } from "react";

// // const AuthContext = createContext();

// // export const AuthProvider = ({ children }) => {
// //   const [user, setUser] = useState(null);
// //   const [token, setToken] = useState(null);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     // Clear any invalid data first
// //     clearInvalidStorage();
    
// //     // Check localStorage first, then sessionStorage
// //     const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
// //     const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");

// //     if (storedUser && storedToken) {
// //       try {
// //         const parsedUser = JSON.parse(storedUser);
        
// //         // Validate that parsed user has required fields
// //         if (parsedUser && parsedUser.id && parsedUser.role) {
// //           setUser(parsedUser);
// //           setToken(storedToken);
// //         } else {
// //           // Invalid user object - clear storage
// //           clearAllStorage();
// //         }
// //       } catch (err) {
// //         console.error("Failed to parse user data:", err);
// //         clearAllStorage();
// //       }
// //     }
    
// //     setLoading(false);
// //   }, []);

// //   const clearInvalidStorage = () => {
// //     try {
// //       // Check and clean localStorage
// //       ["user", "token"].forEach(key => {
// //         const value = localStorage.getItem(key);
// //         if (!value || value === "undefined" || value === "null") {
// //           localStorage.removeItem(key);
// //         }
// //       });

// //       // Check and clean sessionStorage
// //       ["user", "token"].forEach(key => {
// //         const value = sessionStorage.getItem(key);
// //         if (!value || value === "undefined" || value === "null") {
// //           sessionStorage.removeItem(key);
// //         }
// //       });
// //     } catch (err) {
// //       console.error("Error clearing storage:", err);
// //     }
// //   };

// //   const clearAllStorage = () => {
// //     localStorage.removeItem("token");
// //     localStorage.removeItem("user");
// //     sessionStorage.removeItem("token");
// //     sessionStorage.removeItem("user");
// //   };

// //   const login = (data, rememberMe = false) => {
// //     console.log("Login data received:", data); // Debug log
    
// //     let authToken, userData;

// //     // Handle different response formats
// //     if (data.token && data.user) {
// //       // Format: { token: "...", user: {...} }
// //       authToken = data.token;
// //       userData = data.user;
// //     } else if (data.token) {
// //       // Format: { token: "...", ...userFields }
// //       const { token, ...rest } = data;
// //       authToken = token;
// //       userData = rest;
// //     } else {
// //       // Format: user object directly (need to generate/retrieve token differently)
// //       console.error("Invalid login data format. Expected { token, user } or user with token");
// //       console.log("Received:", data);
      
// //       // Check if we have a token elsewhere (e.g., from response headers)
// //       const responseToken = data.accessToken || data.jwt || localStorage.getItem("tempToken");
      
// //       if (responseToken) {
// //         authToken = responseToken;
// //         userData = data;
// //       } else {
// //         console.error("No token found in response");
// //         return;
// //       }
// //     }

// //     // Remove sensitive data before storing
// //     const { password, ...safeUser } = userData;

// //     // Store user data as JSON string
// //     const userString = JSON.stringify(safeUser);

// //     if (rememberMe) {
// //       localStorage.setItem("token", authToken);
// //       localStorage.setItem("user", userString);
// //     } else {
// //       sessionStorage.setItem("token", authToken);
// //       sessionStorage.setItem("user", userString);
// //     }

// //     setToken(authToken);
// //     setUser(safeUser);
// //   };

// //   const logout = () => {
// //     clearAllStorage();
// //     setToken(null);
// //     setUser(null);
// //   };

// //   const updateUser = (userData) => {
// //     const updatedUser = { ...user, ...userData };
// //     setUser(updatedUser);

// //     const userString = JSON.stringify(updatedUser);

// //     if (localStorage.getItem("user")) {
// //       localStorage.setItem("user", userString);
// //     } else if (sessionStorage.getItem("user")) {
// //       sessionStorage.setItem("user", userString);
// //     }
// //   };

// //   return (
// //     <AuthContext.Provider
// //       value={{
// //         user,
// //         token,
// //         login,
// //         logout,
// //         updateUser,
// //         isAuthenticated: !!token && !!user,
// //         loading,
// //         isAdmin: user?.role === "ADMIN",
// //         isMentor: user?.role === "MENTOR",
// //         isStudent: user?.role === "STUDENT",
// //       }}
// //     >
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };

// // export const useAuth = () => {
// //   const context = useContext(AuthContext);
// //   if (!context) {
// //     throw new Error("useAuth must be used within AuthProvider");
// //   }
// //   return context;
// // };


// import { createContext, useContext, useEffect, useState, useCallback } from "react";

// const AuthContext = createContext();

// // Constants for storage keys
// const STORAGE_KEYS = {
//   TOKEN: "token",
//   USER: "user",
//   REMEMBER_ME: "rememberMe"
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Initialize auth state from storage
//   useEffect(() => {
//     initializeAuth();
//   }, []);

//   const initializeAuth = () => {
//     try {
//       // Check if user previously chose "Remember Me"
//       const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
      
//       // Get token and user from appropriate storage
//       let storedToken, storedUser;
      
//       if (rememberMe) {
//         storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
//         storedUser = localStorage.getItem(STORAGE_KEYS.USER);
//       } else {
//         // Check session first, fallback to local
//         storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN);
//         storedUser = sessionStorage.getItem(STORAGE_KEYS.USER) || localStorage.getItem(STORAGE_KEYS.USER);
//       }

//       // Validate and set auth state
//       if (storedToken && storedUser) {
//         try {
//           const parsedUser = JSON.parse(storedUser);
          
//           // Validate user object has required fields
//           if (parsedUser && parsedUser.id && parsedUser.role) {
//             setToken(storedToken);
//             setUser(parsedUser);
//           } else {
//             // Invalid user object - clean up
//             clearAllStorage();
//           }
//         } catch (parseError) {
//           console.error("Failed to parse user data:", parseError);
//           clearAllStorage();
//         }
//       }
//     } catch (error) {
//       console.error("Auth initialization error:", error);
//       clearAllStorage();
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Clear all auth data from both storages
//   const clearAllStorage = useCallback(() => {
//     try {
//       // Clear localStorage
//       Object.values(STORAGE_KEYS).forEach(key => {
//         localStorage.removeItem(key);
//       });

//       // Clear sessionStorage
//       Object.values(STORAGE_KEYS).forEach(key => {
//         sessionStorage.removeItem(key);
//       });

//       // Clear any other auth-related items
//       localStorage.removeItem("tempToken");
//       sessionStorage.removeItem("tempToken");
//     } catch (error) {
//       console.error("Error clearing storage:", error);
//     }
//   }, []);

//   // Store auth data in appropriate storage
//   const storeAuthData = useCallback((authToken, userData, rememberMe = false) => {
//     try {
//       // Remove sensitive data before storing
//       const { password, confirmPassword, ...safeUser } = userData;
//       const userString = JSON.stringify(safeUser);

//       // Store in primary storage based on rememberMe
//       if (rememberMe) {
//         localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
//         localStorage.setItem(STORAGE_KEYS.USER, userString);
//         localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
//         // Also store in session as backup
//         sessionStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
//         sessionStorage.setItem(STORAGE_KEYS.USER, userString);
//       } else {
//         // Default: session storage only
//         sessionStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
//         sessionStorage.setItem(STORAGE_KEYS.USER, userString);
//         localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "false");
//         // Clear localStorage if it exists from previous "remember me"
//         localStorage.removeItem(STORAGE_KEYS.TOKEN);
//         localStorage.removeItem(STORAGE_KEYS.USER);
//       }
//     } catch (error) {
//       console.error("Error storing auth data:", error);
//     }
//   }, []);

//   // Login function
//   const login = useCallback((data, rememberMe = false) => {
//     console.log("Login data received:", data);
    
//     let authToken, userData;

//     // Handle different response formats
//     if (data.token && data.user) {
//       // Format: { token: "...", user: {...} }
//       authToken = data.token;
//       userData = data.user;
//     } else if (data.token && (data.id || data.email)) {
//       // Format: { token: "...", ...userFields }
//       const { token: extractedToken, ...rest } = data;
//       authToken = extractedToken;
//       userData = rest;
//     } else if (data.accessToken) {
//       // Format: { accessToken: "...", ...userFields }
//       const { accessToken, ...rest } = data;
//       authToken = accessToken;
//       userData = rest;
//     } else {
//       console.error("Invalid login data format:", data);
//       throw new Error("Invalid response format from server");
//     }

//     // Validate required fields
//     if (!authToken || !userData) {
//       console.error("Missing token or user data");
//       throw new Error("Authentication failed: Missing credentials");
//     }

//     // Store auth data
//     storeAuthData(authToken, userData, rememberMe);
    
//     // Update state
//     const { password, confirmPassword, ...safeUser } = userData;
//     setToken(authToken);
//     setUser(safeUser);
//   }, [storeAuthData]);

//   // Logout function
//   const logout = useCallback(() => {
//     clearAllStorage();
//     setToken(null);
//     setUser(null);
//   }, [clearAllStorage]);

//   // Update user data
//   const updateUser = useCallback((userData) => {
//     const updatedUser = { ...user, ...userData };
//     const { password, confirmPassword, ...safeUser } = updatedUser;
    
//     setUser(safeUser);

//     // Update in appropriate storage
//     const userString = JSON.stringify(safeUser);
    
//     if (localStorage.getItem(STORAGE_KEYS.TOKEN)) {
//       localStorage.setItem(STORAGE_KEYS.USER, userString);
//     }
    
//     if (sessionStorage.getItem(STORAGE_KEYS.TOKEN)) {
//       sessionStorage.setItem(STORAGE_KEYS.USER, userString);
//     }
//   }, [user]);

//   // Get token helper function (for API calls)
//   const getToken = useCallback(() => {
//     return localStorage.getItem(STORAGE_KEYS.TOKEN) || 
//            sessionStorage.getItem(STORAGE_KEYS.TOKEN) || 
//            token;
//   }, [token]);

//   // Context value
//   const value = {
//     user,
//     token,
//     login,
//     logout,
//     updateUser,
//     getToken,
//     isAuthenticated: !!token && !!user,
//     loading,
//     isAdmin: user?.role === "ADMIN",
//     isMentor: user?.role === "MENTOR",
//     isStudent: user?.role === "STUDENT",
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook for using auth context
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider");
//   }
//   return context;
// };

// export default AuthContext;

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext();

const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  REMEMBER_ME: "rememberMe"
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state - RUNS ON EVERY MOUNT/REFRESH
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log("Initializing auth from storage...");
        
        // First check if remember me was enabled
        const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
        console.log("Remember me:", rememberMe);
        
        let storedToken = null;
        let storedUser = null;
        
        if (rememberMe === "true") {
          // User chose "Remember Me" - check localStorage first
          storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
          storedUser = localStorage.getItem(STORAGE_KEYS.USER);
          console.log("Checking localStorage (Remember Me):", { 
            hasToken: !!storedToken, 
            hasUser: !!storedUser 
          });
        } else {
          // Check sessionStorage first, then fallback to localStorage
          storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN) || 
                       localStorage.getItem(STORAGE_KEYS.TOKEN);
          storedUser = sessionStorage.getItem(STORAGE_KEYS.USER) || 
                      localStorage.getItem(STORAGE_KEYS.USER);
          console.log("Checking sessionStorage:", { 
            hasToken: !!storedToken, 
            hasUser: !!storedUser 
          });
        }

        // If nothing found in preferred storage, try the other one
        if (!storedToken || !storedUser) {
          console.log("Nothing in preferred storage, checking all storage...");
          storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || 
                       sessionStorage.getItem(STORAGE_KEYS.TOKEN);
          storedUser = localStorage.getItem(STORAGE_KEYS.USER) || 
                      sessionStorage.getItem(STORAGE_KEYS.USER);
        }

        console.log("Final storage check:", { 
          hasToken: !!storedToken, 
          hasUser: !!storedUser 
        });

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // Validate user object
            if (parsedUser && (parsedUser.id || parsedUser._id) && parsedUser.role) {
              console.log("Valid user found, setting auth state");
              setToken(storedToken);
              setUser(parsedUser);
              
              // Ensure data exists in both storages for redundancy
              if (!sessionStorage.getItem(STORAGE_KEYS.TOKEN)) {
                sessionStorage.setItem(STORAGE_KEYS.TOKEN, storedToken);
                sessionStorage.setItem(STORAGE_KEYS.USER, storedUser);
              }
              if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) {
                localStorage.setItem(STORAGE_KEYS.TOKEN, storedToken);
                localStorage.setItem(STORAGE_KEYS.USER, storedUser);
                localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
              }
            } else {
              console.warn("Invalid user object structure:", parsedUser);
              clearAllStorage();
            }
          } catch (parseError) {
            console.error("Failed to parse user data:", parseError);
            clearAllStorage();
          }
        } else {
          console.log("No stored auth data found");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAllStorage();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // Run once on mount

  const clearAllStorage = useCallback(() => {
    console.log("Clearing all auth storage");
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }, []);

  const storeAuthData = useCallback((authToken, userData, rememberMe = false) => {
    try {
      console.log("Storing auth data:", { rememberMe, hasToken: !!authToken });
      
      // Remove sensitive data
      const { password, confirmPassword, passwordHash, ...safeUser } = userData;
      const userString = JSON.stringify(safeUser);

      // ALWAYS store in sessionStorage (for current session)
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      sessionStorage.setItem(STORAGE_KEYS.USER, userString);

      if (rememberMe) {
        // Also store in localStorage for persistence across sessions
        localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
        localStorage.setItem(STORAGE_KEYS.USER, userString);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
        console.log("Stored in localStorage (Remember Me enabled)");
      } else {
        // Clear localStorage if remember me is off
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "false");
        console.log("Stored in sessionStorage only");
      }
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  }, []);

  const login = useCallback((data, rememberMe = false) => {
    console.log("Login function called with data:", data);
    
    let authToken, userData;

    // Handle different response formats
    if (data.token && data.user) {
      authToken = data.token;
      userData = data.user;
    } else if (data.token && (data.id || data.email)) {
      const { token: extractedToken, ...rest } = data;
      authToken = extractedToken;
      userData = rest;
    } else if (data.accessToken || data.access_token) {
      const { accessToken, access_token, ...rest } = data;
      authToken = accessToken || access_token;
      userData = rest;
    } else {
      console.error("Invalid login data format:", data);
      throw new Error("Invalid response format from server");
    }

    if (!authToken) {
      throw new Error("No token received from server");
    }

    if (!userData || (!userData.id && !userData._id)) {
      throw new Error("Invalid user data received from server");
    }

    // Store auth data
    storeAuthData(authToken, userData, rememberMe);
    
    // Update state
    const { password, confirmPassword, ...safeUser } = userData;
    setToken(authToken);
    setUser(safeUser);
    
    console.log("Login successful");
  }, [storeAuthData]);

  const logout = useCallback(() => {
    console.log("Logging out");
    clearAllStorage();
    setToken(null);
    setUser(null);
  }, [clearAllStorage]);

  const updateUser = useCallback((userData) => {
    const updatedUser = { ...user, ...userData };
    const { password, confirmPassword, ...safeUser } = updatedUser;
    
    setUser(safeUser);

    // Update in both storages
    const userString = JSON.stringify(safeUser);
    
    if (localStorage.getItem(STORAGE_KEYS.TOKEN)) {
      localStorage.setItem(STORAGE_KEYS.USER, userString);
    }
    
    if (sessionStorage.getItem(STORAGE_KEYS.TOKEN)) {
      sessionStorage.setItem(STORAGE_KEYS.USER, userString);
    }
  }, [user]);

  const getToken = useCallback(() => {
    return token || 
           localStorage.getItem(STORAGE_KEYS.TOKEN) || 
           sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  }, [token]);

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    getToken,
    isAuthenticated: !!token && !!user,
    loading,
    isAdmin: user?.role === "ADMIN",
    isMentor: user?.role === "MENTOR",
    isStudent: user?.role === "STUDENT",
  };

  // Don't render children until auth is initialized
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;