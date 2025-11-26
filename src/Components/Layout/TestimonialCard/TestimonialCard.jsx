import { SiMinutemailer } from "react-icons/si";
import { FaBookReader } from "react-icons/fa";
import { MdMarkAsUnread } from "react-icons/md";
import { GiClick } from "react-icons/gi";
import { useEffect, useState } from "react";

const ProcessCard = ({ icon: Icon, title, description, link, scrollTarget }) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setAnimating(false);
      }, 2000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isExternalLink = (url) => /^https?:\/\//.test(url);

  const handleClick = (e) => {
    if (scrollTarget) {
      e.preventDefault();
      const target = document.getElementById(scrollTarget);
      if (target) {
        const offset = 150; // scroll a bit below the section
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-md transition duration-300 transform hover:scale-105 group">
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-full border-2 border-[#2acb35] mb-4">
        <Icon className="text-[#2acb35] text-2xl md:text-4xl z-10" />
        <div className="absolute animate-spin-slow">
          <div className="w-3 h-3 bg-[#2acb35] rounded-full" />
        </div>
      </div>

      <div className="relative">
        <a
          href={scrollTarget ? `#${scrollTarget}` : link}
          onClick={scrollTarget ? handleClick : undefined}
          className="relative inline-block text-xl font-semibold text-gray-700 transition duration-300"
          {...(isExternalLink(link)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <span className="title-text underline relative z-10 pb-1">{title}</span>
          <GiClick
            className={`absolute text-[#2acb35] text-lg md:text-xl click-icon transition-opacity duration-300 ${
              animating ? "opacity-100" : "opacity-0"
            }`}
          />
        </a>
      </div>

      <p className="text-base text-gray-600 mt-2">{description}</p>
    </div>
  );
};

const EnvironmentalProcess = () => {
  const steps = [
    {
      icon: MdMarkAsUnread,
      title: "Join Us",
      description:
        "Stay connected with us by subscribing to our newsletter. We regularly share practical life tips, uplifting thoughts, and inspiring ideas that can help you grow and feel better every day.",
      link: "https://squirrelnewsletter.com/",
    },
    {
      icon: FaBookReader,
      title: "Explore Blogs",
      description:
        "Explore our inspiring blog posts — each one is designed to give you something meaningful, whether it's motivation, a new perspective, or simply a moment of peace. Reading regularly can truly brighten your day and mindset.",
      link: "/blog",
      scrollTarget: "",
    },
    {
      icon: SiMinutemailer,
      title: "Reach Out",
      description:
        "If you ever need guidance, support, or just someone to listen — we're here for you. Feel free to contact us. We'll do our best to help you shape a better, more joyful life.",
      link: "/contact",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <style>
        {`
          @keyframes spin-slow {
            0% {
              transform: rotate(0deg) translateX(35px) rotate(0deg);
            }
            100% {
              transform: rotate(360deg) translateX(35px) rotate(-360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 4s linear infinite;
          }

          @keyframes click-float {
            0% {
              opacity: 0;
              transform: translate(20px, 8px);
            }
            50% {
              opacity: 1;
              transform: translate(0px, -8px);
            }
            100% {
              opacity: 0;
              transform: translate(10px, 0px);
            }
          }

          .click-icon {
            right: -25px;
            bottom: -5px;
            animation: click-float 2s ease-in-out;
          }
        `}
      </style>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {steps.map((step, index) => (
          <ProcessCard
            key={index}
            icon={step.icon}
            title={step.title}
            description={step.description}
            link={step.link}
            scrollTarget={step.scrollTarget}
          />
        ))}
      </div>
    </div>
  );
};

export default EnvironmentalProcess;
