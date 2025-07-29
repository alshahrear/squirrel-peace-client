import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';

const data = [
    { percentage: 92, title: 'Improved Life Quality', color: '#3F51B5' },      
    { percentage: 95, title: 'Inner Peace & Mental Calm', color: '#009688' },   
    { percentage: 93, title: 'Knowledge & Awareness Growth', color: '#FFC107' }, 
    { percentage: 80, title: 'Took Positive Initiatives in Life', color: '#FF5722' }, 
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
            className="relative rounded-full"
            style={{
                width: '6rem',
                height: '6rem',
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
        <div className='max-w-screen-xl mx-auto px-4'>
            <div className="pb-10 text-center">
                {/* Desktop Success Story button */}
                    <div className="hidden sm:flex justify-end ">
                        <NavLink to="/success">
                            <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition ">
                                Success Story
                            </button>
                        </NavLink>
                    </div>
                <div className="pb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-semibold ">
                            The Impact We Have Made
                        </h2>
                    </div>
                </div>

                <div className=" grid grid-cols-2 md:grid-cols-4 gap-10 justify-center">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <CircularProgress percentage={item.percentage} color={item.color} />
                            <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        </div>
                    ))}
                </div>

                {/* Mobile Success Story button */}
                <div className="sm:hidden mt-10 flex justify-center">
                    <NavLink to="/success" className="w-full">
                        <button className="btn w-full bg-[#2acb35] text-white rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                            Success Story
                        </button>
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default NewsScore;
