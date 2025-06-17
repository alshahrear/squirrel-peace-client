import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';

const data = [
    { percentage: 87, title: 'Prayer Facility', color: '#EF4444' },      // red-500
    { percentage: 95, title: 'Experienced Coach', color: '#22C55E' },    // green-500
    { percentage: 90, title: 'Senior Player', color: '#F59E0B' },        // yellow-500
    { percentage: 80, title: 'Training Ground', color: '#3B82F6' },      // blue-500
];

const CircularProgress = ({ percentage, color }) => {
    const [displayedPercent, setDisplayedPercent] = useState(0);
    const [visible, setVisible] = useState(false);
    const circleRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(entry.target); // animate only once
                }
            },
            { threshold: 0.6 }
        );

        if (circleRef.current) {
            observer.observe(circleRef.current);
        }

        return () => {
            if (circleRef.current) observer.unobserve(circleRef.current);
        };
    }, []);

    useEffect(() => {
        if (visible) {
            let current = 0;
            const interval = setInterval(() => {
                if (current < percentage) {
                    current += 1;
                    setDisplayedPercent(current);
                } else {
                    clearInterval(interval);
                }
            }, 20);
            return () => clearInterval(interval);
        }
    }, [visible, percentage]);

    const rotateDeg = displayedPercent * 3.6;

    return (
        <div
            ref={circleRef}
            className="relative w-24 h-24 rounded-full"
            style={{
                background: `conic-gradient(${color} ${rotateDeg}deg, #E5E7EB ${rotateDeg}deg)`
            }}
        >
            <div className="absolute inset-[10px] bg-white rounded-full flex items-center justify-center text-xl font-bold text-gray-800">
                {displayedPercent}%
            </div>
        </div>
    );
};

const NewsScore = () => {
    return (
        <div className='max-w-screen-xl mx-auto'>
            <div className="pb-12 px-4 text-center">
                <div className='border-y border-dashed border-gray-300 pb-10'>
                    <div className="flex justify-end mb-4">
                        <NavLink to="/success">
                            <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition mt-5">
                                Success Story
                            </button>
                        </NavLink>
                    </div>
                    <div>
                        <h2 className="-mt-10 text-2xl md:text-3xl font-bold mb-3">Professional Hockeys Club</h2>
                        <p className="text-gray-600 max-w-xl mx-auto ">
                            Dit amet consectetur. Condimentum dignissim adipiscing aliquam turpis placerat dolor.
                            Purus urna in sit nullam proin.
                        </p>
                    </div>
                </div>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 justify-center">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <CircularProgress percentage={item.percentage} color={item.color} />
                            <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Amet consectetur. Condimentum dignissim adipiscing.
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewsScore;
