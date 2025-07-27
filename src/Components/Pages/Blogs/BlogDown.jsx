import React from "react";
import { useLocation } from "react-router-dom";

const BlogDown = () => {
    const location = useLocation();

    // Determine the current path
    const path = location.pathname;

    // Define content based on path
    const content = {
        "/adventureDiary": {
            title: "Explore the World, Find Your Peace",
            description:
                "In this category, explore the world's most stunning adventure destinations through captivating, story-driven journeys. Each blog not only expands your knowledge but also soothes the soul — making you feel peace, wonder, and the true joy of discovery. If you're looking for inspiration, inner calm, and the thrill of exploring new places, then Adventure Diary is your perfect escape."
        },
        "/dailyNotes": {
            title: "Small Steps to a Happier Life",
            description:
                "Daily Notes is a special category filled with meaningful daily tips, life-improving advice, and gentle reminders to help bring peace, purpose, and happiness into your everyday life. Each blog offers simple yet powerful insights on how small changes in thoughts, habits, and mindset can make your life more beautiful and balanced. It's your daily dose of clarity, comfort, and inspiration."
        },
        "/smartResource": {
            title: "Small Daily Steps to Grow",
            description:
                "Smart Resource is your little corner of helpful things — practical tips, useful tools, and smart ideas to make life easier, happier, and more organized. Whether you want to save time, grow personally, or just live a little smarter — this section is here to guide you gently, one step at a time."
        },
        "/story": {
            title: "A Little Joy, A Gentle Lesson - All Within the Story",
            description:
                "Here you'll find heartfelt stories where each character's journey holds a meaningful lesson. These short narratives are more than just entertainment—they offer reflections, emotions, and insights that stay with you long after reading. Every story is a reminder that even small moments can teach us something big about life."
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

export default BlogDown;
