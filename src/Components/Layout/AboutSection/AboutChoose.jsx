
const features = [
    {
        title: "The newsletter that makes you smile",
        description: "We send newsletters that inspire happiness, share useful tips, and motivate you to lead a healthier, more joyful life every day.",
    },
    {
        title: "Inspiring Blogs for a Happier Life",
        description: "We write blogs that inspire, educate, and bring joy—helping you discover new perspectives and live a richer, happier life every day.",
    },
    {
        title: "Personalized support for your better life",
        description: "People reach out to us directly, sharing their life struggles. We help each one personally to transform their life into a better, happier journey.",
    },
    {
        title: "Bring good things into life",
        description: "With us, access a wealth of life resources designed to help you lead a better, happier life—experience true positive change by staying connected.",
    },
    {
        title: "Always here to support you",
        description: "Our strong support has helped many people join us and transform their lives for the better—experience the difference with us today.",
    },
    {
        title: "Explore, Connect, and Elevate Your Life",
        description: "Explore the world and uplift your life. Connect with us to grow and take your journey to a better level every day.",
    },
];

const AboutChoose = () => {
    return (
        <div className="py-10 my-5 bg-[#F7F7F7] text-center px-4 sm:px-6 md:px-8">
            <h2 className="text-2xl md:text-3xl font-semibold mb-10">Why Stay With Us</h2>
            <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 sm:p-6 text-left shadow hover:shadow-lg transition hover:scale-105 hover:border-[#2acb35] bg-white"
                    >
                        <h3 className="inline-block font-semibold text-lg mb-2 pb-2">
                            {feature.title}
                        </h3>
                        <div className="flex flex-col items-start gap-3 sm:gap-5">
                            <p className="text-gray-700 text-left hover:font-medium">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AboutChoose;
