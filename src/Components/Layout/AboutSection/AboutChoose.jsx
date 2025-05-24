import { FaAppleAlt, FaDumbbell, FaHeartbeat, FaRegComments, FaUserAlt, FaCertificate } from "react-icons/fa";

const features = [
    {
        icon: <FaAppleAlt className="text-green-500 text-4xl" />,
        title: "Nutrition Strategies",
        description: "Provides a professional dietary and nutrition consulting service aimed to helping you achieve. Provides a professional dietary and nutrition consulting service aimed to helping you achieve.",
    },
    {
        icon: <FaDumbbell className="text-green-500 text-4xl" />,
        title: "Workout Routines",
        description: "Finding a workout is as easy scrolling down, picking out the session that matches your goals. Finding a workout is as easy scrolling down, picking out the session that matches your goals.",
    },
    {
        icon: <FaHeartbeat className="text-green-500 text-4xl" />,
        title: "Support & Motivation",
        description: "We cannot always expect each of our clients to maintain a consistent level of motivation, no matter. We cannot always expect each of our clients to maintain a consistent level of motivation, no matter.",
    },
    {
        icon: <FaRegComments className="text-green-500 text-4xl" />,
        title: "First Hand Advice",
        description: "Provides a professional dietary and nutrition consulting service aimed to helping you achieve. Provides a professional dietary and nutrition consulting service aimed to helping you achieve.",
    },
    {
        icon: <FaUserAlt className="text-green-500 text-4xl" />,
        title: "Individual Coaching",
        description: "Reach your wellness goals quick with personalized coaching. We focus on turning weight loss, stress. Reach your wellness goals quick with personalized coaching. We focus on turning weight loss, stress.",
    },
    {
        icon: <FaCertificate className="text-green-500 text-4xl" />,
        title: "Certified Company",
        description: "Provides a professional dietary and nutrition consulting service aimed to helping you achieve. Provides a professional dietary and nutrition consulting service aimed to helping you achieve.",
    },
];

const AboutChoose = () => {
    return (
        <div className="py-16 bg-white text-center">
            <p className="text-[#2acb35] text-2xl font-semibold italic mb-2">Our Qualification</p>
            <h2 className="text-3xl md:text-2xl font-bold mb-10">WHY PEOPLE CHOOSING US</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <div key={index} className="border border-dashed border-gray-300 rounded-lg p-6 text-left shadow hover:shadow-lg transition hover:scale-105 hover:border-[#2acb35]">
                        <h3 className="inline-block font-semibold text-lg mb-2 border-b-1 border-dashed border-b-[#2acb35] pb-2">
                            {feature.title}
                        </h3>
                        <div className="flex items-center gap-5">
                            <p className="">{feature.icon}</p>
                            <p className="text-gray-600 text-sm hover:font-medium text-start">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AboutChoose;
