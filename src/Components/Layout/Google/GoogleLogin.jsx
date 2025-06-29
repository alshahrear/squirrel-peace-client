// import {
//     GoogleAuthProvider,
//     signInWithPopup,
//     signInWithRedirect,
//     getRedirectResult,
// } from "firebase/auth";
// import { FcGoogle } from "react-icons/fc";
// import { useLocation, useNavigate } from "react-router-dom";
// import { auth } from "../../Firebase/firebase.config";
// import toast from "react-hot-toast";
// import useAxiosPublic from "../../../hooks/useAxiosPublic";
// import { useEffect } from "react";

// const GoogleLogin = () => {
//     const googleProvider = new GoogleAuthProvider();
//     const axiosPublic = useAxiosPublic();
//     const location = useLocation();
//     const navigate = useNavigate();

//     const redirectPath = location.state?.from?.pathname || "/";

//     const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

//     const handleGoogleLogin = () => {
//         if (isMobile) {
//             signInWithRedirect(auth, googleProvider);
//         } else {
//             signInWithPopup(auth, googleProvider)
//                 .then((result) => {
//                     const user = result.user;
//                     saveUserAndRedirect(user);
//                 })
//                 .catch((error) => {
//                     console.error("Popup Login Failed:", error);
//                     toast.error("Google login failed. Please try again.");
//                 });
//         }
//     };

//     const saveUserAndRedirect = (user) => {
//         const userInfo = {
//             email: user?.email,
//             name: user?.displayName,
//         };
//         axiosPublic.post("/users", userInfo)
//             .then(() => {
//                 toast.success("Welcome back! You've logged in successfully.");
//                 navigate(redirectPath);
//             })
//             .catch(() => {
//                 toast.error("Something went wrong saving your account.");
//             });
//     };

//     // ⬇️ Redirect result handle
//     useEffect(() => {
//         getRedirectResult(auth)
//             .then((result) => {
//                 if (result?.user) {
//                     saveUserAndRedirect(result.user);
//                 }
//             })
//             .catch((error) => {
//                 console.error("Redirect Login Error:", error);
//             });
//     }, []);

//     return (
//         <div className="flex justify-center">
//             <div className="animate__animated animate__slideInRight w-full max-w-md px-4">
//                 <div className="divider divider-success">OR</div>
//                 <div className="flex gap-3 items-center">
//                     <button
//                         type="button"
//                         onClick={handleGoogleLogin}
//                         className="relative overflow-hidden w-full py-3 px-6 sm:px-10 md:px-20 text-white text-lg font-medium border-2 border-[#2acb35] rounded-md transition-colors duration-300 group bg-[#2acb35] shadow-md"
//                     >
//                         <span className="relative z-10 flex items-center justify-center gap-2 transition-colors duration-300 group-hover:text-[#404040]">
//                             <span className="text-xl"><FcGoogle /></span> Login With Google
//                         </span>
//                         <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0 pointer-events-none"></span>
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default GoogleLogin;
