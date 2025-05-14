import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../Firebase/firebase.config";

const GoogleLogin = () => {
    const googleProvider = new GoogleAuthProvider();

    const location = useLocation();
    const navigate = useNavigate();

    const handleGoogleLogin = () => {

        signInWithPopup(auth, googleProvider)
            .then(result => {
                console.log(result.user);
                const redirectPath = location.state?.from?.pathname || "/";
                // console.log("Redirecting to:", redirectPath);
                navigate(redirectPath);
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        <div className="flex justify-center">
            <div className="animate__animated animate__slideInRight">
                <div className="divider divider-success">OR</div>
                <div className="flex gap-3 items-center">
                    <button onClick={handleGoogleLogin} className="relative overflow-hidden w-full py-1 px-36 text-white text-lg font-medium border-2 border-[#2acb35] rounded-md transition-colors duration-300 group bg-[#2acb35] shadow-md">
                        <span className="relative z-10 flex items-center justify-center gap-2 transition-colors duration-300 group-hover:text-[#404040]">
                            <span className="text-xl"><FcGoogle /></span> Login With Google
                        </span>
                        <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleLogin;