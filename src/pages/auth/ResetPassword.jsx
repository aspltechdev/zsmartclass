import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function ResetPassword() {

    const navigate = useNavigate();

    const email = sessionStorage.getItem("resetEmail");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    useEffect(()=>{

        if(!email){

            navigate("/forgot-password");

        }

    },[]);

    const handleSubmit = async(e)=>{

        e.preventDefault();

        if(password !== confirmPassword){

            return alert("Passwords do not match");

        }

        try{

            setLoading(true);

            const res = await api.post("/auth/reset-password",{

                email,
                password

            });

            alert(res.data.message);

            sessionStorage.removeItem("resetEmail");

            navigate("/login");

        }catch(err){

            alert(
                err.response?.data?.message ||
                "Reset Failed"
            );

        }finally{

            setLoading(false);

        }

    };

    return(

        <div className="auth-page">

            <div className="auth-left">

                <h1>Reset Password</h1>

                <p>Create a new password.</p>

            </div>

            <div className="auth-right">

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <h2>New Password</h2>

                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e)=>setConfirmPassword(e.target.value)}
                    />

                    <button
                        disabled={loading}
                    >
                        {
                            loading
                            ? "Updating..."
                            : "Update Password"
                        }
                    </button>

                </form>

            </div>

        </div>

    );

}

export default ResetPassword;