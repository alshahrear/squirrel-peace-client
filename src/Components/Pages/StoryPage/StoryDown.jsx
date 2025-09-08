import React from "react";
import { useLocation } from "react-router-dom";

const StoryDown = () => {
    const location = useLocation();

    // Determine the current path
    const path = location.pathname;

    // Define content based on path
    const content = {
        "/blog": {
            title: "Insights for a Happier, Healthier Life",
            description:
                "Discover thoughtful blogs that share practical tips, inspiring ideas, and gentle reflections on happy living and well-being. Each post is designed to bring positivity, balance, and simple lessons that can enrich your everyday life."
        }
    };

    // Check if current path matches any category
    const current = content[path];

    if (!current) return null;

    return (
        <div className="bg-[#F7F7F7] py-8 px-4 md:px-10 lg:px-20">
            <div className="max-w-5xl mx-auto text-center">
                <h2 className="text-2xl sm:text-2xl md:text-3xl font-semibold mb-4 text-gray-800">
                    {current.title}
                </h2>
                <p className="md:text-lg text-gray-600 leading-relaxed">
                    {current.description}
                </p>
            </div>
        </div>
    );
};

export default StoryDown;