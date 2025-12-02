// WinCards.jsx
import { useEffect, useState } from "react";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import male from "../../../assets/male.jpg";
import female from "../../../assets/female.jpg";
import other from "../../../assets/female.jpg";
import { RiDeleteBin6Line } from "react-icons/ri";
import Swal from "sweetalert2";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import { useNavigate } from "react-router-dom";

const WinCards = () => {
  const axiosPublic = useAxiosPublic();
  const [winners, setWinners] = useState([]);
  const [index, setIndex] = useState(0);
  const { user } = useAuth();
  const [isAdmin] = useAdmin();
  const [phase, setPhase] = useState("enter"); // enter → stay → exit
  const [isPaused, setIsPaused] = useState(false); // loop pause control
  const navigate = useNavigate();

  // Winner data fetch
  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await axiosPublic.get(
          "https://squirrel-peace-server.onrender.com/winner"
        );
        setWinners(res.data || []);
      } catch (error) {
        console.error("Error fetching winners:", error);
      }
    };
    fetchWinners();
  }, [axiosPublic]);

  // Animation phase control (loop)
  useEffect(() => {
    if (!winners.length || isPaused) return;

    let timer;
    if (phase === "enter") {
      timer = setTimeout(() => setPhase("stay"), 700);
    } else if (phase === "stay") {
      timer = setTimeout(() => setPhase("exit"), 5000);
    } else if (phase === "exit") {
      timer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % winners.length); // mobile ek ek kore
        setPhase("enter");
      }, 700);
    }

    return () => clearTimeout(timer);
  }, [phase, winners.length, isPaused]);

  if (!winners.length) {
    return (
      <div className="py-10 mb-10 max-w-screen-xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-lg font-semibold">Loading winners...</p>
      </div>
    );
  }

  // visibleCards
  const visibleCards =
    window.innerWidth < 640
      ? [winners[index % winners.length]]
      : [
          winners[index % winners.length],
          winners[(index + 1) % winners.length],
        ];

  const getAvatar = (gender) => {
    if (gender === "Male") return male;
    else if (gender === "Female") return female;
    else return other;
  };

  const getBorderClass = (gender) => {
    if (gender === "Male") return "border-blue-400 bg-blue-50";
    else if (gender === "Female") return "border-pink-400 bg-pink-50";
    else return "border-gray-400 bg-gray-50";
  };

  // Delete Winner
  const handleDelete = (winner) => {
    setIsPaused(true);

    Swal.fire({
      title: `Are you sure to delete ${winner.winnerName}?`,
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2acb35",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`https://squirrel-peace-server.onrender.com/winner/${winner._id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire({
                position: "top-end",
                icon: "success",
                title: `${winner.winnerName} has been deleted`,
                showConfirmButton: false,
                timer: 1500,
              });

              setWinners((prev) => prev.filter((w) => w._id !== winner._id));

              setIndex((prev) => {
                if (prev >= winners.length - 1) return 0;
                return prev % Math.max(winners.length - 1, 1);
              });
            }
            setIsPaused(false);
          });
      } else {
        setIsPaused(false);
      }
    });
  };

  return (
    <div
      className="py-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12
      bg-gradient-to-r from-[#2acb35] to-[#1e7a29] 
      rounded-2xl text-white overflow-hidden"
    >
      <div className="text-center mb-10 relative">
        <h2 className="text-2xl font-semibold mb-3">
          Meet Our Quiz Winners
        </h2>
        <p className="max-w-2xl md:max-w-3xl mx-auto text-base">
          Discover the brilliant participants who stood out in our quizzes and claimed their victory. Want to see your name here too? Join the quiz today and take the challenge.
        </p>

        {/* Admin Button (Desktop) */}
        {user && isAdmin && (
          <button
            onClick={() => navigate("/winnerAdmin")}
            className="hidden sm:block absolute top-0 right-0 bg-white text-green-700 font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow hover:bg-gray-100 text-sm sm:text-base"
          >
            Winner Admin
          </button>
        )}

        {/* Admin Button (Mobile) */}
        {user && isAdmin && (
          <div className="mt-4 sm:hidden">
            <button
              onClick={() => navigate("/winnerAdmin")}
              className="bg-white text-green-700 font-medium px-3 py-1.5 rounded-lg shadow hover:bg-gray-100 "
            >
              Winner Admin
            </button>
          </div>
        )}
      </div>

      <div className="relative flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-10 lg:gap-16 h-auto sm:h-[500px] overflow-hidden">
        {visibleCards.map((t, i) => {
          if (!t) return null;

          let animationClass = "";
          if (phase === "enter") {
            if (window.innerWidth < 640) {
              animationClass = "translate-x-[120%] opacity-0 animate-slideInLeft";
            } else {
              animationClass =
                i === 0
                  ? "translate-x-[-120%] opacity-0 animate-slideInLeft"
                  : "translate-x-[120%] opacity-0 animate-slideInRight";
            }
          } else if (phase === "stay") {
            animationClass = "translate-x-0 translate-y-0 opacity-100";
          } else if (phase === "exit") {
            if (window.innerWidth < 640) {
              animationClass =
                "translate-x-[-120%] opacity-0 transition-all duration-700 ease-in-out";
            } else {
              animationClass =
                "translate-y-[150%] opacity-0 transition-all duration-700 ease-in-out";
            }
          }

          return (
            <div
              key={t._id}
              className={`w-full sm:w-[320px] md:w-[500px] h-auto sm:h-[500px] p-4 sm:p-6 
              bg-white text-black rounded-2xl shadow-lg 
              flex flex-col justify-between relative
              transition-all duration-700 ease-in-out ${animationClass}`}
            >
              {/* Delete button */}
              {user && isAdmin && (
                <button
                  onClick={() => handleDelete(t)}
                  className="absolute top-3 right-3 p-1.5 sm:p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full shadow-md"
                >
                  <RiDeleteBin6Line className="text-lg sm:text-xl" />
                </button>
              )}

              {/* Top Info */}
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 p-1 ${getBorderClass(
                        t.winnerGender
                      )}`}
                    >
                      <img
                        src={getAvatar(t.winnerGender)}
                        alt={t.winnerName}
                        className="w-16 h-16 p-2 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        {t.winnerName}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Quiz Winner
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-700 text-base space-y-2 md:space-y-0">
                    <p>
                      <span className="font-semibold">Gift:</span>{" "}
                      {t.winnerGift}
                    </p>
                    <p>
                      <span className="font-semibold">Date:</span>{" "}
                      {t.winnerDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="mt-3 pb-2">
                <img
                  src={t.giftImage}
                  alt={t.winnerGift}
                  className="w-full h-72 sm:h-80 md:h-96 object-cover rounded-2xl"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WinCards;
